(function (window) {

    /**
     * @constructs Dropdown
     * @param {Object} config - initialization config
     *
     * @param {Element} config.element
     * @param {Boolean} [config.multiselect=true]
     * @param {Boolean} [config.showAvatar=true]
     * @param {Number} [config.itemHeight=50]
     * @param {Number} [config.itemsBuffer=10]
     * @param {Number} [config.pictureUrl]
     * @param {Object[]} [config.items]
     * @param {Function} [config.keyFunction]
     * @param {Function} [config.displayFunction]
     * @param {string} [config.placeholder]
     * @param {Function} [config.remoteDataSource]
     * @param {number} [config.pageSize]
     * @param {string} [config.notFoundMessage]
     * @param {Function} [config.onSelect]
     */
    function Dropdown(config) {
        this.multiselect      = config.multiselect !== undefined ? config.multiselect : true;
        this.showAvatar       = config.showAvatar !== undefined ? config.showAvatar : true;
        this.itemHeight       = config.itemHeight || 50;
        this.itemsBuffer      = config.itemsBuffer || 10;
        this.pictureUrl       = config.pictureUrl || "";
        this.keyFunction      = config.keyFunction || defaultKeyFunction;
        this.displayFunction  = config.displayFunction || defaultDisplayFunction;
        this.placeholder      = config.placeholder || "Введите часть имени или домена";
        this.remoteDataSource = config.remoteDataSource || window.VKSearch.searchRemote;
        this.pageSize         = config.pageSize || 200;
        this.notFoundMessage  = config.notFoundMessage || "Пользователь не найден";
        this.onSelect         = config.onSelect || null;

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
        var filteredItems;
        _this.totalCount = null;
        _this.serverSearchPerformed = false;
        _this.updateState({notFound: false});
        if (this.filterText && this.filterText.length > 0) {
            filteredItems = window.VKSearch.searchLocal(this.filterText, this.items)
        } else {
            filteredItems = this.items;
        }
        filteredItems      = filteredItems.filter(function (item) {
            return _this.selectedItems[_this.keyFunction(item)] === undefined;
        });
        this.filteredItems = filteredItems;

        if (this.filterText && filteredItems.length < (this.elements.menu.offsetHeight / this.itemHeight + this.itemsBuffer)) {
            this.updateState({loading: true});
            this.remoteDataSource({search: this.filterText, offset: 0, count: this.pageSize}).then(function (response) {
                _this.serverSearchPerformed = true;
                _this.totalCount = response.totalCount;
                _this.updateState({loading: false});
                _this.items         = merge(_this.items, response.data, _this.keyFunction);
                _this.filteredItems = merge(_this.filteredItems, response.data, _this.keyFunction);
                if (_this.filteredItems.length === 0) {
                    _this.updateState({notFound: true});
                } else {
                    _this.updateState({notFound: false});
                }
                _this.renderMenu();
                _this.setFocusedItem(0);
            })
        }
    };

    Dropdown.prototype.renderButton = function () {
        var newTokens = document.createDocumentFragment();
        for (var key in this.selectedItems) {
            newTokens.appendChild(this.tokenFactory(this.selectedItems[key], key))
        }

        var oldTokens = this.elements.button.querySelectorAll('.dd-token');
        if (oldTokens && oldTokens.length > 0) {
            Array.prototype.forEach.call(oldTokens, function (node) {
                node.parentNode.removeChild(node);
            });
        }

        this.elements.button.insertBefore(newTokens, this.elements.button.childNodes[0]);
        var hasSelectedItems = Object.getOwnPropertyNames(this.selectedItems).length > 0;

        updateClass(this.elements.button, 'dd-single-select', !this.multiselect);
        updateClass(this.elements.button, 'dd-with-selection', hasSelectedItems);
    };

    Dropdown.prototype.renderMenu = function () {
        var scrollHeight          = this.filteredItems.length * this.itemHeight;
        var itemsContainer        = this.elements.menu.querySelector('.dd-items-container');
        var scrollTop             = this.elements.menu.scrollTop;
        var menuHeight            = this.elements.menu.offsetHeight;
        var firstVisibleItemIndex = Math.ceil(scrollTop / this.itemHeight);
        var lastVisibleItemIndex  = Math.round(scrollTop / this.itemHeight + menuHeight / this.itemHeight);

        this.lastRenderScrollTop = scrollTop;

        itemsContainer.style.height = scrollHeight + 'px';

        var additionalItemsCount = this.itemsBuffer;

        if (firstVisibleItemIndex === 0 || lastVisibleItemIndex === this.filteredItems.length - 1) {
            additionalItemsCount += this.itemsBuffer * 2;
        }

        firstVisibleItemIndex = Math.max(0, firstVisibleItemIndex - additionalItemsCount);
        lastVisibleItemIndex  = Math.min(this.filteredItems.length - 1, lastVisibleItemIndex + additionalItemsCount);


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

        if (lastVisibleItemIndex === this.filteredItems.length - 1) {
            tryInfiniteScroll.call(this)
        }
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
        el.setAttribute('title', item.domain ? item.domain : [local]);
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
                        updateClass(this.elements.button, 'dd-opened', this.state.open);
                    }
                    break;
                case 'loading':
                    if (this.state.loading !== newStatePartial[key]) {
                        this.state.loading = newStatePartial[key];
                        updateClass(this.elements.menu, 'dd-loading', this.state.loading);
                    }
                    break;
                case 'notFound':
                    if (this.state.notFound !== newStatePartial[key]) {
                        this.state.notFound = newStatePartial[key];
                        updateClass(this.elements.menu, 'dd-not-found', this.state.notFound);
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
        if (this.focusedItem) {
            updateClass(this.focusedItem, 'dd-menu-item-focus', false);
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
        if (this.focusedItem) {
            updateClass(this.focusedItem, 'dd-menu-item-focus', true);
        }
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
        if (!this.multiselect) this.selectedItems = {};
        var index                                                       = parseInt(this.focusedItem.getAttribute('data-index'));
        this.selectedItems[this.keyFunction(this.filteredItems[index])] = this.filteredItems[index];
        this.filteredItems.splice(index, 1);
        this.elements.button.querySelector('.dd-input').blur();
        this.renderButton();
        if (this.onSelect) this.onSelect();
    };

    Dropdown.prototype.value = function () {
        if (this.multiselect) return Object.values(this.selectedItems);
        return Object.values(this.selectedItems)[0];
    };

    var init = function (element) {
        this.elements        = {};
        var button           = createDiv(
            '<div class="dd-token-add">Добавить<div class="dd-token-add-icon"></div></div>' +
            '<input type="text" class="dd-input" placeholder="' + this.placeholder + '"/>' +
            '<div class="dd-arrow"></div>'
            , 'dd-button'
        );
        var menu             = createDiv(
            '<div class="dd-items-container"></div>' +
            '<div class="dd-items-not-found">' + this.notFoundMessage + '</div>' +
            '<div class="dd-items-loading"><div class="dd-spinner"><div></div><div></div><div></div></div></div>'
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
        var _this     = this;
        var input     = this.elements.button.querySelector('.dd-input');
        var arrow     = this.elements.button.querySelector('.dd-arrow');
        var addButton = this.elements.button.querySelector('.dd-token-add');

        // --- Button events start
        input.addEventListener('focus', function () {
            _this.focusTimeStamp = new Date();
            _this.updateState({open: true});
        });
        input.addEventListener('blur', function () {
            _this.updateState({open: false});
        });
        input.addEventListener('input', function () {
            onInputChanged.call(_this, input.value);
        });
        arrow.addEventListener('click', function () {
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
            if (event.target.nodeName !== "INPUT") {
                event.preventDefault();
            }
        });
        this.elements.button.addEventListener('click', function (event) {
            if (event.target === _this.elements.button || event.target === addButton || event.target.parentNode === addButton) {
                input.focus();
            }
            if (event.target.className.indexOf('dd-token-remove-icon') > -1) {
                remove.call(_this, event.target.parentNode);
            }
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
        });
        // ^^^ Button events end


        // --- Menu events start
        this.elements.menu.addEventListener('scroll', function () {
            var scrollTop = _this.elements.menu.scrollTop;
            if (Math.abs(scrollTop - _this.lastRenderScrollTop) > _this.itemHeight * Math.max(0, _this.itemsBuffer - 1)) {
                _this.renderMenu();
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
            } else {
                input.blur();
                return;
            }
            _this.selectAndClose(_this.focusedItem);
        });
        // ^^^ Menu events start
    };

    var updateMenuVisibility = function () {
        if (this.state.open) {
            this.runFilter();
            this.scrollTo(0);
            this.renderMenu();
            var _this = this;
            _this.setFocusedItem(0);
        }
        updateClass(this.elements.menu, 'dd-opened', this.state.open)
    };

    var defaultKeyFunction = function (item) {
        return item._id;
    };

    var defaultDisplayFunction = function (item) {
        return item.name + ' ' + item.surname;
    };

    var remove = function (element) {
        var id = element.getAttribute('data-key');
        delete this.selectedItems[id];
        this.renderButton();
        if (this.state.open) {
            this.runFilter();
            this.renderMenu();
        }
    };

    var onInputChanged = function (text) {
        this.filterText = text;
        this.runFilter();
        this.scrollTo(0);
        this.renderMenu();
        var _this = this;
        _this.setFocusedItem(0);
    };

    var merge = function (array1, array2, keyFunction) {
        var cleanedArray = array2.concat();
        for (var i = 0; i < cleanedArray.length; ++i) {
            for (var j = 0; j < array1.length; ++j) {
                if (keyFunction(cleanedArray[i]) === keyFunction(array1[j])) {
                    cleanedArray.splice(i, 1);
                    i--;
                    break;
                }
            }
        }
        return array1.concat(cleanedArray);
    };

    var updateClass = function (element, className, shouldPresent) {
        if (element.className.indexOf(className) === -1 && shouldPresent) {
            element.className += ' ' + className;
        }
        if (element.className.indexOf(className) > -1 && !shouldPresent) {
            element.className = element.className.replace(' ' + className, '');
        }
    };

    var tryInfiniteScroll = function() {
        var _this = this;
        if (this.state.loading) return;
        if (!this.serverSearchPerformed) {
            _this.updateState({loading: true});
            this.remoteDataSource({search: this.filterText || null, offset: 0, count: this.filteredItems.length}).then(function (response) {
                _this.updateState({loading: false});
                _this.items         = merge(_this.items, response.data, _this.keyFunction);
                _this.filteredItems = merge(_this.filteredItems, response.data, _this.keyFunction);
                _this.renderMenu();
                _this.serverSearchPerformed = true;
            });
            return;
        }
        if (this.totalCount === null || this.totalCount === undefined || this.totalCount > this.filteredItems.length) {
            _this.updateState({loading: true});
            this.remoteDataSource({search: this.filterText || null, offset: this.filteredItems.length, count: this.pageSize}).then(function (response) {
                _this.updateState({loading: false});
                _this.filteredItems = _this.filteredItems.concat(response.data);
                _this.totalCount = response.totalCount;
                _this.renderMenu();
            })
        }
    };

    window.VKDropdown = Dropdown;
})(window);