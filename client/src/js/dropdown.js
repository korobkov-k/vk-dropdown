(function (window) {
    /**
     * @constructs Dropdown
     * @param {Object} config - initialization config
     * @param {Boolean} [config.multiselect=false]
     * @param {Boolean} [config.showAvatar=false]
     * @param {Number} [config.itemHeight=50]
     * @param {Number} [config.itemsBuffer=10]
     * @param {Number} [config.pictureUrl]
     * @param {Element} config.element
     * @param {Object[]} [config.items]
     */
    function Dropdown(config) {
        this.multiselect = config.multiselect || false;
        this.showAvatar  = config.showAvatar || false;
        this.itemHeight  = config.itemHeight || 50;
        this.itemsBuffer = config.itemsBuffer || 10;
        this.pictureUrl  = config.pictureUrl || "";
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
        this.filteredItems = this.items; //TODO
    };

    Dropdown.prototype.renderButton = function () {
        //TODO
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

        firstVisibleItemIndex = Math.max(0, firstVisibleItemIndex - this.itemsBuffer);
        lastVisibleItemIndex  = Math.min(this.filteredItems.length - 1, lastVisibleItemIndex + this.itemsBuffer);

        var newElements = document.createDocumentFragment();
        for (var i = firstVisibleItemIndex; i <= lastVisibleItemIndex; i++) {
            var newItem            = this.itemElementFactory(this.filteredItems[i], this.showAvatar, this.pictureUrl);
            newItem.style.top      = (i * this.itemHeight) + 'px';
            newItem.style.height   = this.itemHeight + 'px';
            newItem.style.position = 'absolute';
            newElements.appendChild(newItem);
        }

        itemsContainer.innerHTML = "";
        itemsContainer.appendChild(newElements);
    };

    Dropdown.prototype.itemElementFactory = function (item, withPicture, pictureURL) {
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
        el.innerHTML = template;
        return el;
    };

    Dropdown.prototype.updateState = function(newStatePartial) {
        for (var key in newStatePartial) {
            switch (key) {
                case 'open':
                    if (this.state.open !== newStatePartial[key]){
                        this.state.open = newStatePartial[key];
                        updateMenuVisibility.call(this);
                    }
                    break;
                default:
                    break;
            }
        }
    };

    var init = function (element) {
        this.elements        = {};
        var button           = createDiv(
            '<div class="dd-tokens"></div>' +
            '<button class="dd-token-add"></button>' +
            '<input type="text" class="dd-input" />'
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
        this.elements.menu.addEventListener('scroll', function () {
            var scrollTop = _this.elements.menu.scrollTop;
            if (Math.abs(scrollTop - _this.lastRenderScrollTop) > _this.itemHeight * Math.max(0, _this.itemsBuffer - 1)) {
                _this.renderMenu();
            }
        });
        this.elements.button.querySelector('.dd-input').addEventListener('focus', function () {
            _this.updateState({open:true});
        });
        this.elements.button.querySelector('.dd-input').addEventListener('blur', function () {
            _this.updateState({open:false});
        });
    };

    var updateMenuVisibility = function() {
        if (this.state.open) {
            this.elements.menu.style.display = 'block';
        } else {
            this.elements.menu.style.display = 'none';
        }
    };

    window.VKDropdown = Dropdown;
})(window);