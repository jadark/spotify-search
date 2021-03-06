var app = new Vue({
    el: '#app',
    data: {
        user: [],
        logged: (sessionStorage.getItem('token')) ? true : false,
        accessToken: (sessionStorage.getItem('token')) ? sessionStorage.getItem('token') : ''
    },
    beforeMount: function () {
        function getURLParameter(name) {
            return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search) || [null, ''])[1].replace(/\+/g, '%20')) || null;
        }
        if (getURLParameter('callback')) {
            var urlHash = window.location.hash;
            urlHash = urlHash.split('=');
            
            token = urlHash[1];
            tokenString = token.split('&');
            this.accessToken = tokenString[0];
            sessionStorage.setItem('logged', true);
            sessionStorage.setItem('token', tokenString[0]);
            window.history.pushState({}, document.title, "/");
        }
    },
    mounted: function () {
        this.getUserData();
    },
    methods: {
        checkForm: function (e) {
            e.preventDefault();
            console.log(e);
        },
        login(callback) {
            var CLIENT_ID = '97c8ca87b809402b9682ab80c8f7fe1e';
            var REDIRECT_URI = 'http://localhost:5500?callback=true';

            function getLoginURL(scopes) {
                return 'https://accounts.spotify.com/authorize?client_id=' + CLIENT_ID +
                    '&redirect_uri=' + encodeURIComponent(REDIRECT_URI) +
                    '&scope=' + encodeURIComponent(scopes.join(' ')) +
                    '&response_type=token';
            }

            var url = getLoginURL([
                'user-read-email'
            ]);

            var width = 450,
                height = 730,
                left = (screen.width / 2) - (width / 2),
                top = (screen.height / 2) - (height / 2);

            window.addEventListener("message", function (event) {
                var hash = JSON.parse(event.data);
                if (hash.type == 'access_token') {
                    callback(hash.access_token);
                }
            }, false);
            window.location = url;
            //   var w = window.open(url,
            //     'Spotify',
            //     'menubar=no,location=no,resizable=no,scrollbars=no,status=no, width=' + width + ', height=' + height + ', top=' + top + ', left=' + left
            //    );

        },
        getUserData() {
            var dataToken = this.accessToken;
            if (this.logged) {                
                axios.get('https://api.spotify.com/v1/me', {
                    headers: { Authorization: "Bearer " + this.accessToken }
                }).then(response => {
                    this.user = response.data;
                    console.log(this.user.country);
                    
                })
            }
        },
        getAuth: function() {
                this.login(function(accessToken) {
                this.getUserData(accessToken)
                    .then(function(response) {
                        alert(response);
                        this.display = true;
                    });
                });
        }        
    }
  })