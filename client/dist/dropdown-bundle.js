(function () {
    function Dropdown(config) {
        this.multiselect = config.multiselect || false;
        this.showAvatar  = config.showAvatar || false;
        this.itemHeight = config.itemHeight || 20;
        this.itemsBuffer = config.itemsBuffer || 10;
        this.pictureUrl = config.pictureUrl || "";
        if (config.element) {
            init(config.element)
        } else {
            throw "Error initializing dropdown. Property 'element' must contain target element reference."
        }
        if (config.items) {
            this.update(config.items);
        }
    }

    Dropdown.prototype.update = function(items) {
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

    Dropdown.prototype.renderButton = function() {
        //TODO
    };

    Dropdown.prototype.renderMenu = function() {
        var scrollHeight = this.filteredItems.length * this.itemHeight;
        var itemsContainer = this.elements.menu.querySelector('.dd-items-container');
        var scrollTop = this.elements.menu.scrollTop;
        var menuHeight = this.elements.menu.offsetHeight;
        var firstVisibleItemIndex = scrollTop/this.itemHeight;
        var lastVisibleItemIndex = scrollTop/this.itemHeight + menuHeight/this.itemHeight;

        itemsContainer.style.height = scrollHeight + 'px';

        firstVisibleItemIndex = Math.max(0, firstVisibleItemIndex - this.itemsBuffer);
        lastVisibleItemIndex = Math.min(this.filteredItems.length - 1, lastVisibleItemIndex + this.itemsBuffer);

        var newElements = document.createDocumentFragment();
        for(var i = firstVisibleItemIndex; i<=lastVisibleItemIndex; i++) {
            var newItem = this.itemElementFabric(this.filteredItems[i], this.showAvatar, this.pictureUrl);
            newItem.style.top = (i * this.itemHeight) + 'px';
            newItem.style.position = 'absolute';
            newElements.appendChild(newItem);
        }

        itemsContainer.innerHTML = "";
        itemsContainer.appendChild(newElements);
    };

    Dropdown.prototype.itemElementFabric = function (item, withPicture, pictureURL) {
        var template = '<div class="dd-menu-item">' +
            (withPicture ? '<img class="dd-item-picture" src="$AVATAR"' : '') +
            '<span class="dd-item-name">$NAME</span>' +
            '<span class="dd-item-info">$INFO</span>' +
            '</div>';
        if (withPicture) {
            if (!pictureURL) {
                console.error('Error while creating row. Param \'withPicture\' was provided. ' +
                    'Param \'PictureURL\' must be provided in this case.')
            }
            template = template.replace('$AVATAR', pictureURL + (item.avatar || 'placeholder'));
        }
        template = template.replace('$NAME', item.name + ' ' + item.surname);
        template = template.replace('$SURNAME', item.info);

        var el = document.createElement('div');
        el.outerHTML = template;
        return el;
    };

    var init = function (element) {
        this.elements        = {};
        this.elements.button = createDiv(
            '<div class="dd-toggle">' +
            '<div class="dd-tokens"></div>' +
            '<button class="dd-token-add"></button>' +
            '<input type="text" class="dd-input" />' +
            '</div>'
        );
        this.elements.menu   = createDiv(
            '<div class="dd-menu">' +
            '<div class="dd-items-container"></div>' +
            '</div>'
        );
        element.appendChild(this.elements.buttons);
        element.appendChild(this.elements.menu);
    };

    var createDiv = function (template) {
        var el       = document.createElement('div');
        el.outerHTML = template || "";
        return el;
    };

    window.VKDropdown = Dropdown;
})();