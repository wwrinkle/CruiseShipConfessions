var app = angular.module('CruiseShipConfessionsApp', ['ui.bootstrap']);


app.directive('offClick', ['$rootScope', '$parse', function($rootScope, $parse) {
    var id = 0;
    var listeners = {};

    document.addEventListener("touchend", offClickEventHandler, true);
    document.addEventListener('click', offClickEventHandler, true);

    function targetInFilter(target, elms) {
        if (!target || !elms) return false;
        var elmsLen = elms.length;
        for (var i = 0; i < elmsLen; ++i)
            if (elms[i].contains(target)) return true;
        return false;
    }

    function offClickEventHandler(event) {
        var target = event.target || event.srcElement;
        angular.forEach(listeners, function(listener, i) {
            if (!(listener.elm.contains(target) || targetInFilter(target, listener.offClickFilter))) {
                $rootScope.$evalAsync(function() {
                    listener.cb(listener.scope, {
                        $event: event
                    });
                })
            }

        });
    }

    return {
        restrict: 'A',
        compile: function($element, attr) {
            var fn = $parse(attr.offClick);
            return function(scope, element) {
                var elmId = id++;
                var offClickFilter;
                var removeWatcher;

                offClickFilter = document.querySelectorAll(scope.$eval(attr.offClickFilter));

                if (attr.offClickIf) {
                    removeWatcher = $rootScope.$watch(function() {
                        return $parse(attr.offClickIf)(scope);
                    }, function(newVal) {
                        if (newVal) {
                            on();
                        } else if (!newVal) {
                            off();
                        }
                    });
                } else {
                    on();
                }

                attr.$observe('offClickFilter', function(value) {
                    offClickFilter = document.querySelectorAll(scope.$eval(value));
                });

                scope.$on('$destroy', function() {
                    off();
                    if (removeWatcher) {
                        removeWatcher();
                    }
                });

                function on() {
                    listeners[elmId] = {
                        elm: element[0],
                        cb: fn,
                        scope: scope,
                        offClickFilter: offClickFilter
                    };
                }

                function off() {
                    delete listeners[elmId];
                }
            };
        }
    };
}]);

app.controller('FormController', function($scope, $rootScope, $http) {
    $scope.charsLeft = 140;
    $scope.lengthProtection = function() {
        $scope.charsLeft = 140 - $scope.tweet.length;
        if ($scope.tweet.length > 140) {
            $scope.tweet = $scope.tweet.substring(0, 140);
            $scope.charsLeft = 0;
        }
    };
    $scope.createMathProb = function() {
        var randomInterger = function(range) {
            return Math.floor(Math.random() * range);
        };
        $scope.randomNumber1 = randomInterger(10);
        $scope.randomNumber2 = randomInterger(10);
        $scope.problemOperator = randomInterger(2);
        if ($scope.problemOperator > 0 && $scope.randomNumber2 > $scope.randomNumber1) {
            $scope.randomNumber2 = randomInterger($scope.randomNumber1);
        }
        if ($scope.problemOperator == 0) {
            $scope.mathProb = $scope.randomNumber1 + $scope.randomNumber2;
            $scope.mathProbString = $scope.randomNumber1 + ' + ' + $scope.randomNumber2 + ' =';
        } else {
            $scope.mathProb = $scope.randomNumber1 - $scope.randomNumber2;
            $scope.mathProbString = $scope.randomNumber1 + ' - ' + $scope.randomNumber2 + ' =';
        }
    };
    $scope.createMathProb();
    $scope.mathErrorBool = false;
    $scope.errorBool = false;
    $rootScope.submitBool = true;
    $scope.submitTweet = function() {
        if ($scope.mathProb == $scope.mathAnswer) {
            $http({
                    method: 'POST',
                    url: 'php/submit.php',
                    data: $scope.tweet,
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                })
                .success(function(data) {
                    if (data.success) {
                        $scope.returnMessage = 'Success';
                        $scope.mathErrorBool = false;
                        $scope.errorBool = false;
                        $rootScope.submitBool = !$rootScope.submitBool;
                        $scope.createMathProb();
                        $scope.mathAnswer = '';
                        $scope.tweet = '';
                    } else {
                        $scope.returnMessage = 'Something went wrong';
                        console.log(data);
                        $scope.mathErrorBool = false;
                        $scope.errorBool = true;
                    }
                })
                .error(function(data) {
                    $scope.returnMessage = 'Something went wrong';
                    console.log(data);
                    $scope.mathErrorBool = false;
                    $scope.errorBool = true;
                });
        } else {
            $scope.returnMessage = 'Check your math!';
            $scope.mathErrorBool = true;
            $scope.errorBool = false;
        }
    };
    $scope.focusBool = false;
    $scope.setFocus = function() {
        document.getElementById('message').focus();
    };
});
app.controller('TOSController', function($scope, $modal) {
    $scope.open = function() {
        var modalInstance = $modal.open({
            animation: $scope.animationsEnabled,
            templateUrl: 'tos/tos.html',
            controller: 'ModalInstanceCtrl',
            size: 'lg',
        });
    };
});
app.controller('ModalInstanceCtrl', function($scope, $modalInstance) {
    $scope.close = function() {
        $modalInstance.close();
    };
})
app.controller('PreviousTweetsController', function($scope, $rootScope, $http) {
    $scope.getTweets = function() {
        $http.get('php/getTweets.php').success(function(response) {
            $scope.initialTweetsLength = Object.keys(response).length - 2;
            $scope.tweets = [];
            for (var i = 0; i < $scope.initialTweetsLength; i++) {
                $scope.tweets[i] = response[i];
                $scope.tweets[i].date = new Date(response[i].created_at);
                $scope.tweets[i].personNumber = 0;
            }
            for (var j = 0; j < $scope.tweets.length; j++) {
                if ($scope.tweets[j].source.search('Cruise Ship Confessions') == -1) {
                    $scope.tweets.splice(j, 1);
                }
                if ($scope.tweets[j].text.search('http://') > -1) {
                    $scope.tweets.splice(j, 1);
                } else if ($scope.tweets[j].in_reply_to_screen_name != undefined) {
                    $scope.tweets.splice(j, 1);
                }
            }
            $scope.fillerTweets = 6 - ($scope.tweets.length % 6);
            $scope.fillerStart = 3;
            $scope.filler = {
                personNumber: 7
            };
            if ($scope.fillerTweets > 0) {
                for (var k = 0; k < $scope.fillerTweets; k++) {
                    $scope.tweets.splice($scope.fillerStart, 0, $scope.filler);
                    $scope.fillerStart += Math.ceil(($scope.tweets.length - 3) / $scope.fillerTweets);
                }
            }
            $scope.personNumber = 1;
            for (var l = 0; l < $scope.tweets.length; l++) {
                if ($scope.tweets[l].personNumber != 7) {
                    $scope.tweets[l].personNumber = $scope.personNumber;
                }
                $scope.personNumber++;
                if ($scope.personNumber > 6) {
                    $scope.personNumber = 1;
                }
            }
            $scope.tweet1 = 0;
            $scope.tweet2 = 1;
            $scope.tweet3 = 2;
        });
    };
    $scope.getTweets();
    $rootScope.$watch(
        function() {
            return $rootScope.submitBool;
        },
        function(newValue, oldValue) {
            if (newValue !== oldValue) {
                $scope.getTweets();
            }
        }
    );
    $scope.next = function() {
        var tweetIndexAdd = function(tweet) {
            tweet++;
            if (tweet > $scope.tweets.length - 1) {
                tweet = 0;
            }
            return tweet;
        };
        $scope.tweet1 = tweetIndexAdd($scope.tweet1);
        $scope.tweet2 = tweetIndexAdd($scope.tweet2);
        $scope.tweet3 = tweetIndexAdd($scope.tweet3);
    };
    $scope.back = function() {
        var tweetIndexSubtract = function(tweet) {
            tweet--;
            if (tweet < 0) {
                tweet = $scope.tweets.length - 1;
            }
            return tweet;
        };
        $scope.tweet1 = tweetIndexSubtract($scope.tweet1);
        $scope.tweet2 = tweetIndexSubtract($scope.tweet2);
        $scope.tweet3 = tweetIndexSubtract($scope.tweet3);
    };
    $scope.personBackground = function(personNumber) {
        if (personNumber != undefined) {
            return 'url(img/person' + personNumber + '.jpg)';
        }
    };
    $scope.preloadImages = function() {
        $scope.images = []
        for (var k = 1; k <= 7; k++) {
            $scope.images[k] = new Image();
            $scope.images[k].src = 'img/person' + k + '.jpg';
        }
    };
    $scope.preloadImages();
});