(function (VKDropdown) {
    var onload = function () {
        var dd = new VKDropdown({
            element: document.getElementsByClassName('vk-dropdown')[0],
            showAvatar: true,
            pictureUrl: '/images/avatars/'
        });
        var users = JSON.parse(localStorage.getItem('users'));
        dd.update(users);
    };
    document.addEventListener('DOMContentLoaded', onload, false);

})(window.VKDropdown);