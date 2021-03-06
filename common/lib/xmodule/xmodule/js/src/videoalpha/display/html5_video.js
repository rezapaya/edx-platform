this.HTML5Video = (function () {
    var HTML5Video;

    HTML5Video = {};

    HTML5Video.Player = (function () {
        Player.prototype.callStateChangeCallback = function () {
            if ($.isFunction(this.config.events.onStateChange) === true) {
                this.config.events.onStateChange({
                    'data': this.playerState
                });
            }
        };

        Player.prototype.pauseVideo = function () {
            this.video.pause();
        };

        Player.prototype.seekTo = function (value) {
            if ((typeof value === 'number') && (value <= this.video.duration) && (value >= 0)) {
                this.start = 0;
                this.end = this.video.duration;

                this.video.currentTime = value;
            }
        };

        Player.prototype.setVolume = function (value) {
            if ((typeof value === 'number') && (value <= 100) && (value >= 0)) {
                this.video.volume = value * 0.01;
            }
        };

        Player.prototype.getCurrentTime = function () {
            return this.video.currentTime;
        };

        Player.prototype.playVideo = function () {
            this.video.play();
        };

        Player.prototype.getPlayerState = function () {
            return this.playerState;
        };

        Player.prototype.getVolume = function () {
            return this.video.volume;
        };

        Player.prototype.getDuration = function () {
            if (isFinite(this.video.duration) === false) {
                return 0;
            }

            return this.video.duration;
        };

        Player.prototype.setPlaybackRate = function (value) {
            var newSpeed;

            newSpeed = parseFloat(value);

            if (isFinite(newSpeed) === true) {
                this.video.playbackRate = value;
            }
        };

        Player.prototype.getAvailablePlaybackRates = function () {
            return [0.75, 1.0, 1.25, 1.5];
        };

        return Player;

        /*
         * Constructor function for HTML5 Video player.
         *
         * @el - A DOM element where the HTML5 player will be inserted (as returned by jQuery(selector) function),
         * or a selector string which will be used to select an element. This is a required parameter.
         *
         * @config - An object whose properties will be used as configuration options for the HTML5 video
         * player. This is an optional parameter. In the case if this parameter is missing, or some of the config
         * object's properties are missing, defaults will be used. The available options (and their defaults) are as
         * follows:
         *
         *     config = {
         *
         *         'videoSources': {},   // An object with properties being video sources. The property name is the
         *                               // video format of the source. Supported video formats are: 'mp4', 'webm', and
         *                               // 'ogg'.
         *
         *          'playerVars': {     // Object's properties identify player parameters.
         *              'start': 0,     // Possible values: positive integer. Position from which to start playing the
         *                              // video. Measured in seconds. If value is non-numeric, or 'start' property is
         *                              // not specified, the video will start playing from the beginning.
         *
         *              'end': null     // Possible values: positive integer. Position when to stop playing the
         *                              // video. Measured in seconds. If value is null, or 'end' property is not
         *                              // specified, the video will end playing at the end.
         *
         *          },
         *
         *          'events': {         // Object's properties identify the events that the API fires, and the
         *                              // functions (event listeners) that the API will call when those events occur.
         *                              // If value is null, or property is not specified, then no callback will be
         *                              // called for that event.
         *
         *              'onReady': null,
         *              'onStateChange': null
         *          }
         *     }
         */
        function Player(el, config) {
            var sourceStr, _this;

            // If el is string, we assume it is an ID of a DOM element. Get the element, and check that the ID
            // really belongs to an element. If we didn't get a DOM element, return. At this stage, nothing will
            // break because other parts of the video player are waiting for 'onReady' callback to be called.
            if (typeof el === 'string') {
                this.el = $(el);

                if (this.el.length === 0) {
                    return;
                }
            } else if (el instanceof jQuery) {
                this.el = el;
            } else {
                return;
            }

            // A simple test to see that the 'config' is a normal object.
            if ($.isPlainObject(config) === true) {
                this.config = config;
            } else {
                return;
            }

            // We should have at least one video source. Otherwise there is no point to continue.
            if (config.hasOwnProperty('videoSources') === false) {
                return;
            }

            // From the start, all sources are empty. We will populate this object below.
            sourceStr = {
                'mp4': ' ',
                'webm': ' ',
                'ogg': ' '
            };

            // Will be used in inner functions to point to the current object.
            _this = this;

            // Create HTML markup for individual sources of the HTML5 <video> element.
            $.each(sourceStr, function (videoType, videoSource) {
                if (
                    (_this.config.videoSources.hasOwnProperty(videoType) === true) &&
                    (typeof _this.config.videoSources[videoType] === 'string') &&
                    (_this.config.videoSources[videoType].length > 0)
                ) {
                    sourceStr[videoType] =
                        '<source ' +
                            'src="' + _this.config.videoSources[videoType] + '" ' +
                            'type="video/' + videoType + '" ' +
                        '/> ';
                }
            });

            // We should have at least one video source. Otherwise there is no point to continue.
            if ((sourceStr.mp4 === ' ') && (sourceStr.webm === ' ') && (sourceStr.ogg === ' ')) {
                return;
            }

            // Determine the starting and ending time for the video.
            this.start = 0;
            this.end = null;
            if (config.hasOwnProperty('playerVars') === true) {
                this.start = parseFloat(config.playerVars.start);
                if ((isFinite(this.start) !== true) || (this.start < 0)) {
                    this.start = 0;
                }

                this.end = parseFloat(config.playerVars.end);
                if ((isFinite(this.end) !== true) || (this.end < this.start)) {
                    this.end = null;
                }
            }

            // Create HTML markup for the <video> element, populating it with sources from previous step.
            this.videoEl = $(
                '<video style="width: 100%;">' +
                    sourceStr.mp4 +
                    sourceStr.webm +
                    sourceStr.ogg +
                '</video>'
            );

            // Get the DOM element (to access the HTML5 video API), and set the player state to UNSTARTED.
            // The player state is used by other parts of the VideoPlayer to detrermine what the video is
            // currently doing.
            this.video = this.videoEl[0];
            this.playerState = HTML5Video.PlayerState.UNSTARTED;
            // this.callStateChangeCallback();

            // Attach a 'click' event on the <video> element. It will cause the video to pause/play.
            this.videoEl.on('click', function (event) {
                if (_this.playerState === HTML5Video.PlayerState.PAUSED) {
                    _this.video.play();
                    _this.playerState = HTML5Video.PlayerState.PLAYING;
                    _this.callStateChangeCallback();
                } else if (_this.playerState === HTML5Video.PlayerState.PLAYING) {
                    _this.video.pause();
                    _this.playerState = HTML5Video.PlayerState.PAUSED;
                    _this.callStateChangeCallback();
                }
            });

            // When the <video> tag has been processed by the browser, and it is ready for playback,
            // notify other parts of the VideoPlayer, and initially pause the video.
            //
            // Also, at this time we can get the real duration of the video. Update the starting end ending
            // points of the video. Note that first time, the video will start playing at the specified start time,
            // and end playing at the specified end time. After it was paused, or when a seek operation happeded,
            // the starting time and ending time will reset to the beginning and the end of the video respectively.
            this.video.addEventListener('canplay', function () {
                // Because firefox triggers 'canplay' event every time when 'currentTime' property
                // changes, we must make sure that this block of code runs only once. Otherwise,
                // this will be an endless loop ('currentTime' property is changed below).
                //
                // Chrome is immune to this behavior.
                if (_this.playerState !== HTML5Video.PlayerState.UNSTARTED) {
                    return;
                }

                _this.playerState = HTML5Video.PlayerState.PAUSED;

                if (_this.start > _this.video.duration) {
                    _this.start = 0;
                }
                if ((_this.end === null) || (_this.end > _this.video.duration)) {
                    _this.end = _this.video.duration;
                }
                _this.video.currentTime = _this.start;

                if ($.isFunction(_this.config.events.onReady) === true) {
                    _this.config.events.onReady(null);
                }
            }, false);

            // Register the 'play' event.
            this.video.addEventListener('play', function () {
                _this.playerState = HTML5Video.PlayerState.PLAYING;
                _this.callStateChangeCallback();
            }, false);

            // Register the 'pause' event.
            this.video.addEventListener('pause', function () {
                _this.playerState = HTML5Video.PlayerState.PAUSED;
                _this.callStateChangeCallback();
            }, false);

            // Register the 'ended' event.
            this.video.addEventListener('ended', function () {
                _this.playerState = HTML5Video.PlayerState.ENDED;
                _this.callStateChangeCallback();
            }, false);

            // Register the 'timeupdate' event. This is the place where we control when the video ends.
            // If an ending time was specified, then after the video plays through to this spot, pauses, we
            // must make sure to update the ending time to the end of the video. This way, the user can watch
            // any parts of it afterwards.
            this.video.addEventListener('timeupdate', function (data) {
                if (_this.end < _this.video.currentTime) {
                    // When we call video.pause(), a 'pause' event will be formed, and we will catch it
                    // in another handler (see above).
                    _this.video.pause();
                    _this.end = _this.video.duration;
                }
            }, false);

            // Place the <video> element on the page.
            this.videoEl.appendTo(this.el.find('.video-player div'));
        }
    }());

    HTML5Video.PlayerState = {
        'UNSTARTED': -1,
        'ENDED': 0,
        'PLAYING': 1,
        'PAUSED': 2,
        'BUFFERING': 3,
        'CUED': 5
    };

    return HTML5Video;
}());
