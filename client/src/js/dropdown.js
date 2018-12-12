(function (window) {
    var logOn = true;
    var L     = logOn ? console.log : function (message) {
    };

    /**
     * @constructs Dropdown
     * @param {Object} config - initialization config
     *
     * @param {Element} config.element
     * @param {Boolean} [config.multiselect=false]
     * @param {Boolean} [config.showAvatar=false]
     * @param {Number} [config.itemHeight=50]
     * @param {Number} [config.itemsBuffer=10]
     * @param {Number} [config.pictureUrl]
     * @param {Object[]} [config.items]
     * @param {Function} [config.keyFunction]
     * @param {Function} [config.displayFunction]
     * @param {Function} [config.placeholder]
     */
    function Dropdown(config) {
        this.multiselect     = config.multiselect || false;
        this.showAvatar      = config.showAvatar || false;
        this.itemHeight      = config.itemHeight || 50;
        this.itemsBuffer     = config.itemsBuffer || 10;
        this.pictureUrl      = config.pictureUrl || "";
        this.keyFunction     = config.keyFunction || defaultKeyFunction;
        this.displayFunction = config.displayFunction || defaultDisplayFunction;
        this.placeholder     = config.placeholder || "Введите часть имени или домена";

        this.selectedItems = {};
        if (config.element) {
            init.call(this, config.element);
        } else {
            throw "Error initializing dropdown. Property 'element' must contain target element reference."
        }
        if (config.items) {
            this.update(config.items);
        }
    }

    Dropdown.prototype.update = function (items) {
        this.items = items;
        this.runFilter();
        this.render();
    };

    Dropdown.prototype.render = function () {
        this.renderButton();
        this.renderMenu();
    };

    Dropdown.prototype.runFilter = function () {
        var _this = this;
        this.filteredItems = this.items.filter(function (item) {
            return _this.selectedItems[_this.keyFunction(item)] === undefined;
        });
    };

    Dropdown.prototype.renderButton = function () {
        L('render button');
        var newTokens          = document.createDocumentFragment();
        for (var key in this.selectedItems) {
            newTokens.appendChild(this.tokenFactory(this.selectedItems[key], key))
        }

        var oldTokens = this.elements.button.querySelectorAll('.dd-token');
        if (oldTokens && oldTokens.length > 0) {
            Array.prototype.forEach.call( oldTokens, function( node ) {
                node.parentNode.removeChild( node );
            });
        }

        this.elements.button.insertBefore(newTokens, this.elements.button.childNodes[0]);
        var hasSelectedItems = Object.getOwnPropertyNames(this.selectedItems).length > 0;
        if (this.multiselect) {
            if (this.elements.button.className.indexOf('dd-multiselect') === -1) {
                this.elements.button.className += ' dd-multiselect'
            }
        } else {
            if (this.elements.button.className.indexOf('dd-multiselect') > -1) {
                this.elements.button.className = this.elements.button.className.replace(' dd-multiselect', '')
            }
        }
        if (hasSelectedItems) {
            if (this.elements.button.className.indexOf('dd-with-selection') === -1) {
                this.elements.button.className += ' dd-with-selection'
            }
        } else {
            if (this.elements.button.className.indexOf('dd-with-selection') > -1) {
                this.elements.button.className = this.elements.button.className.replace(' dd-with-selection', '')
            }
        }
    };

    Dropdown.prototype.renderMenu = function () {
        L('render menu');
        var scrollHeight          = this.filteredItems.length * this.itemHeight;
        var itemsContainer        = this.elements.menu.querySelector('.dd-items-container');
        var scrollTop             = this.elements.menu.scrollTop;
        var menuHeight            = this.elements.menu.offsetHeight;
        var firstVisibleItemIndex = Math.ceil(scrollTop / this.itemHeight);
        var lastVisibleItemIndex  = Math.round(scrollTop / this.itemHeight + menuHeight / this.itemHeight);

        this.lastRenderScrollTop = scrollTop;

        itemsContainer.style.height = scrollHeight + 'px';

        firstVisibleItemIndex = Math.max(0, firstVisibleItemIndex - this.itemsBuffer);
        lastVisibleItemIndex  = Math.min(this.filteredItems.length - 1, lastVisibleItemIndex + this.itemsBuffer);

        if (firstVisibleItemIndex === 0) {
            lastVisibleItemIndex += this.itemsBuffer;
        }
        if (lastVisibleItemIndex === this.filteredItems.length - 1) {
            firstVisibleItemIndex = Math.max(0, firstVisibleItemIndex - this.itemsBuffer);
        }

        var newElements = document.createDocumentFragment();
        for (var i = firstVisibleItemIndex; i <= lastVisibleItemIndex; i++) {
            var newItem            = this.itemElementFactory(this.filteredItems[i], i, this.showAvatar, this.pictureUrl);
            newItem.style.top      = (i * this.itemHeight) + 'px';
            newItem.style.height   = this.itemHeight + 'px';
            newItem.style.position = 'absolute';
            newElements.appendChild(newItem);
        }

        itemsContainer.innerHTML = "";
        itemsContainer.appendChild(newElements);
    };

    Dropdown.prototype.itemElementFactory = function (item, index, withPicture, pictureURL) {
        var template =
                (withPicture ? '<img class="dd-item-picture" src="$AVATAR">' : '') +
                '<div class="dd-item-name">$NAME</div>' +
                '<div class="dd-item-info">$INFO</div>';
        if (withPicture) {
            if (!pictureURL) {
                console.error('Error while creating row. Param \'withPicture\' was provided. ' +
                    'Param \'PictureURL\' must be provided in this case.')
            }
            template = template.replace('$AVATAR', pictureURL + (item.avatar || 'placeholder'));
        }
        template = template.replace('$NAME', item.name + ' ' + item.surname);
        template = template.replace('$INFO', item.info);

        var el       = document.createElement('div');
        el.className = 'dd-menu-item';
        el.setAttribute('data-index', index);
        el.innerHTML = template;
        return el;
    };

    Dropdown.prototype.tokenFactory = function (item, key) {
        var el       = document.createElement('div');
        el.className = 'dd-token';
        el.setAttribute('data-key', key);
        el.innerHTML = this.displayFunction(item) + '<div class="dd-token-remove-icon"></div>';
        return el;
    };

    Dropdown.prototype.updateState = function (newStatePartial) {
        for (var key in newStatePartial) {
            switch (key) {
                case 'open':
                    if (this.state.open !== newStatePartial[key]) {
                        this.state.open = newStatePartial[key];
                        updateMenuVisibility.call(this);
                        updateButtonClass.call(this);
                    }
                    break;
                default:
                    break;
            }
        }
    };

    Dropdown.prototype.scrollTo = function (_position) {
        var position   = parseInt(_position);
        var menuHeight = this.elements.menu.offsetHeight;
        if (position < 0) position = 0;
        if (position > menuHeight) position = menuHeight;
        this.elements.menu.scrollTop = position;
    };

    Dropdown.prototype.setFocusedItem = function (item) {
        if (item && item.className && item.className.indexOf('dd-menu-item-focus') > -1) {
            // Skip focusing on element, that is already focused.
            return;
        }
        L('setFocus');
        if (this.focusedItem) {
            this.focusedItem.className = this.focusedItem.className.replace('dd-menu-item-focus', '');
        }
        if (typeof item === "number") {
            if (item < 0) item = 0;
            if (item > this.filteredItems.length - 1) item = this.filteredItems.length - 1;
            this.focusedItem = this.elements.menu.querySelector('.dd-menu-item[data-index="' + item + '"]');
        } else if (typeof item === "object") {
            this.focusedItem = item;
        } else {
            console.error('Wrong usage of function "setFocusedItem". Parameter should be item html node or item index')
        }
        this.focusedItem.className += ' dd-menu-item-focus';
    };

    Dropdown.prototype.scrollToCurrentItem = function () {
        var scrollTop             = this.elements.menu.scrollTop;
        var menuHeight            = this.elements.menu.offsetHeight;
        var firstVisibleItemIndex = Math.round(scrollTop / this.itemHeight);
        var lastVisibleItemIndex  = Math.ceil(scrollTop / this.itemHeight + menuHeight / this.itemHeight);
        var currentIndex          = parseInt(this.focusedItem.getAttribute('data-index'));
        if (currentIndex <= firstVisibleItemIndex) {
            this.elements.menu.scrollTop = currentIndex * this.itemHeight;
        }
        if (currentIndex >= lastVisibleItemIndex) {
            this.elements.menu.scrollTop = (currentIndex + 1) * this.itemHeight - menuHeight;
        }
    };

    Dropdown.prototype.selectAndClose = function () {
        var index                                                       = parseInt(this.focusedItem.getAttribute('data-index'));
        this.selectedItems[this.keyFunction(this.filteredItems[index])] = this.filteredItems[index];
        this.filteredItems.splice(index, 1);
        this.elements.button.querySelector('.dd-input').blur();
        this.renderButton();
    };

    var init = function (element) {
        this.elements        = {};
        var button           = createDiv(
            '<div class="dd-token-add">Добавить<div class="dd-token-add-icon"></div></div>' +
            '<input type="text" class="dd-input" />' +
            '<div class="dd-arrow"></div>'
            , 'dd-button'
        );
        var menu             = createDiv(
            '<div class="dd-items-container"></div>'
            , 'dd-menu'
        );
        element.innerHTML    = "";
        this.elements.button = element.appendChild(button);
        this.elements.menu   = element.appendChild(menu);

        this.state = {
            open: false
        };

        addEventListeners.call(this);
    };

    var createDiv = function (template, className) {
        var div       = document.createElement('div');
        div.innerHTML = template || "";
        div.className = className || "";
        return div;
    };

    var addEventListeners = function () {
        var _this = this;
        var input = this.elements.button.querySelector('.dd-input');
        var arrow = this.elements.button.querySelector('.dd-arrow');
        var addButton = this.elements.button.querySelector('.dd-token-add');
        this.elements.menu.addEventListener('scroll', function () {
            var scrollTop = _this.elements.menu.scrollTop;
            if (Math.abs(scrollTop - _this.lastRenderScrollTop) > _this.itemHeight * Math.max(0, _this.itemsBuffer - 1)) {
                _this.renderMenu();
            }
        });
        input.addEventListener('focus', function () {
            L('focus');
            _this.focusTimeStamp = new Date();
            _this.updateState({open: true});
        });
        input.addEventListener('blur', function () {
            L('blur');
            _this.updateState({open: false});
        });
        arrow.addEventListener('click', function () {
            L('click');
            if (!_this.state.open) {
                input.focus();
            } else {
                if (new Date() - _this.focusTimeStamp < 120) {
                    // Prevent flickering, when user click on arrow and browser window is not in focus.
                    return;
                }
                input.blur();
            }
        });
        this.elements.button.addEventListener('mousedown', function (event) {
            L('mousedown');
            if (event.target.nodeName !== "INPUT") {
                event.preventDefault();
            }
        });
        this.elements.button.addEventListener('click', function (event) {
            if (event.target === _this.elements.button || event.target === addButton) {
                input.focus();
            }
        });
        this.elements.menu.addEventListener('mouseover', function (event) {
            if (event.target.className.indexOf('dd-menu-item') > -1) {
                _this.setFocusedItem(event.target);
            } else if (event.target.parentNode.className.indexOf('dd-menu-item') > -1) {
                _this.setFocusedItem(event.target.parentNode);
            }
        });
        this.elements.menu.addEventListener('mousedown', function (event) {
            event.preventDefault();
        });
        this.elements.menu.addEventListener('click', function (event) {
            if (event.target.className.indexOf('dd-menu-item') > -1) {
                _this.setFocusedItem(event.target);
            } else if (event.target.parentNode.className.indexOf('dd-menu-item') > -1) {
                _this.setFocusedItem(event.target.parentNode);
            }
            _this.selectAndClose(_this.focusedItem);
        });
        this.elements.button.addEventListener('keydown', function (event) {
            if (event.keyCode === 38) {
                //up
                _this.setFocusedItem(parseInt(_this.focusedItem.getAttribute('data-index')) - 1);
                _this.scrollToCurrentItem();
            }
            if (event.keyCode === 40) {
                //down
                _this.setFocusedItem(parseInt(_this.focusedItem.getAttribute('data-index')) + 1);
                _this.scrollToCurrentItem();
            }
            if (event.keyCode === 13) {
                //enter
                _this.selectAndClose(_this.focusedItem);
            }
        })
    };

    var updateMenuVisibility = function () {
        if (this.state.open) {
            this.runFilter();
            this.scrollTo(0);
            this.renderMenu();
            if (this.elements.menu.className.indexOf('dd-opened') === -1) {
                this.elements.menu.className += ' dd-opened';
            }
            var _this = this;
            setTimeout(function () {
                _this.setFocusedItem(0);
            });
        } else {
            if (this.elements.menu.className.indexOf('dd-opened') > -1) {
                this.elements.menu.className = this.elements.menu.className.replace(' dd-opened', '');
            }
        }
    };

    var updateButtonClass = function () {
        if (this.state.open) {
            if (this.elements.button.className.indexOf('dd-opened') === -1) {
                this.elements.button.className += ' dd-opened';
            }
        } else {
            if (this.elements.button.className.indexOf('dd-opened') > -1) {
                this.elements.button.className = this.elements.button.className.replace(' dd-opened', '');
            }
        }
    };

    var defaultKeyFunction = function (item) {
        return item._id;
    };

    var defaultDisplayFunction = function (item) {
        return item.name + ' ' + item.surname;
    };

    window.VKDropdown = Dropdown;
})(window);