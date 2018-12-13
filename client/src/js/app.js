(function (VKDropdown) {
    var onload = function () {
        var dd = new VKDropdown({
            element: document.getElementsByClassName('vk-dropdown')[0],
            showAvatar: true,
            pictureUrl: '/images/avatars/'
        });
        var users = JSON.parse(localStorage.getItem('users'));
        dd.update(users);

        var dd2 = new VKDropdown({
            element: document.getElementsByClassName('vk-dropdown-single')[0],
            showAvatar: true,
            multiselect: false,
            pictureUrl: '/images/avatars/'
        });
        dd2.update(users);

        var dd3 = new VKDropdown({
            element: document.getElementsByClassName('vk-dropdown-single-no-avatar')[0],
            showAvatar: false,
            multiselect: false
        });
        dd3.update(users);

        var counter = 1;
        document.getElementsByClassName('add-dropdown')[0].addEventListener('click', function () {
            var div = document.createElement('div');
            div.className = 'additional-dd';
            var dd_a = new VKDropdown({
                element: div,
                showAvatar: true,
                multiple: false,
                pictureUrl: '/images/avatars/'
            });
            dd_a.update(users);

            var h2 = document.createElement('h2');
            h2.innerText = "Additional dropdown " + counter++;

            document.querySelector('body').appendChild(h2);
            document.querySelector('body').appendChild(div);
        })
    };
    document.addEventListener('DOMContentLoaded', onload, false);

})(window.VKDropdown);