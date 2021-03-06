var controllerAudioFeedback = require('./controllerAudioFeedback');

/**
 * Handle angular input (arc drawing with touch events)
 */

var throttle = require('./throttle');

var network;

var originX = 0;
var originY = 0;
var dX      = 0;
var dY      = 0;
var prevRadian;
var radian  = 0;

/** @constant */
var PIPI = Math.PI * 2;

var angularSum           = 0;
var audioFeedbackdFreq   = 0;
var AUDIO_FEEDBACK_RANGE = {
    FROM : 200,
    TO   : 2000
};

function resetAudioFeedbackFreq() {
    angularSum         = 0;
    audioFeedbackdFreq = (AUDIO_FEEDBACK_RANGE.TO - AUDIO_FEEDBACK_RANGE.FROM) / PIPI;
    controllerAudioFeedback.setFreq(audioFeedbackdFreq + AUDIO_FEEDBACK_RANGE.FROM);
    controllerAudioFeedback.start();
}

function addAudioFeedbackFreq(dFreq) {
    angularSum += dFreq;

    if(Math.abs(angularSum) > PIPI){
        controllerAudioFeedback.stop();
        controllerAudioFeedback.playSoundFile('pop');
        angularSum = 0;
    } else {
        controllerAudioFeedback.setFreq(angularSum * audioFeedbackdFreq + AUDIO_FEEDBACK_RANGE.FROM);
    }
}

// // // // // // // // // // // // // // // //

function onTouchStart(e) {
    var t = e.changedTouches;

    // Support single touch point
    if (t.length === 1) {
        originX    = t[0].pageX;
        originY    = t[0].pageY;
        prevRadian = 0;
    }

    updateTouchCircle(originX, originY);
    resetAudioFeedbackFreq();
}

function _onTouchMove(e) {
    var t = e.changedTouches;

    // Support single touch point
    if (t.length === 1) {
        dX = t[0].pageX - originX;
        dY = t[0].pageY - originY;

        radian = -Math.atan2(-dY, dX);

        if (!isNaN(prevRadian)) {
            // Stop radians from jumping when they hit PIPI
            prevRadian = prevRadian % PIPI;
            radian     = radian % PIPI;

            // Make sure it can't jump from 180 to -180
            if (Math.abs(radian - prevRadian) > Math.PI) {
                if (radian < prevRadian) {
                    radian += PIPI;
                } else {
                    radian -= PIPI;
                }
            }

            // Send update
            network.emit('angular', { dRadian : radian - prevRadian });
            addAudioFeedbackFreq(radian - prevRadian);
        }

        prevRadian = radian;
        updateTouchCircleSmall(t[0].pageX, t[0].pageY);
    }
}

function onTouchEnd(e) {
    var t = e.changedTouches;

    // Support single touch point
    if (t.length === 1) {
        dX = t[0].pageX - originX;
        dY = t[0].pageY - originY;

        radian = -Math.atan2(-dY, dX);

        if (!isNaN(prevRadian)) {
            // Stop radians from jumping when they hit PIPI
            prevRadian = prevRadian % PIPI;
            radian     = radian % PIPI;

            // Make sure it can't jump from 180 to -180
            if (Math.abs(radian - prevRadian) > Math.PI) {
                if (radian < prevRadian) {
                    radian += PIPI;
                } else {
                    radian -= PIPI;
                }
            }

            // Send update
            network.emit('angular', { dRadian : radian - prevRadian, isEnd : true });
            controllerAudioFeedback.stop();

        }

        prevRadian = undefined;
        dX         = 0;
        dY         = 0;
        originY    = 0;
        originX    = 0;
        updateTouchCircle(-100, -100);
        updateTouchCircleSmall(-100, -100);
    }
}

var onTouchMove = throttle(_onTouchMove, 10);

var circleEl;
var circleSmallEl;

function createTouchCircle() {
    circleEl           = document.createElement('div');
    circleEl.className = 'positionAbsolute circle';
    document.body.appendChild(circleEl);
    circleSmallEl           = document.createElement('div');
    circleSmallEl.className = 'positionAbsolute circleSmall';
    document.body.appendChild(circleSmallEl);
}

function updateTouchCircle(x, y) {
    circleEl.style.transform = 'translate(' + Math.round(x) + 'px ,' + Math.round(y) + 'px)';
}

function updateTouchCircleSmall(x, y) {
    circleSmallEl.style.transform = 'translate(' + Math.round(x) + 'px ,' + Math.round(y) + 'px)';
}

function removeTouchCircles() {
    if (circleEl) circleEl.remove();
    if (circleSmallEl) circleSmallEl.remove();
    circleEl      = undefined;
    circleSmallEl = undefined;
}

function init(networkInstance) {
    createTouchCircle();
    updateTouchCircle(-100, -100);
    updateTouchCircleSmall(-100, -100);

    network = networkInstance;
    window.addEventListener('touchstart', onTouchStart);
    window.addEventListener('touchmove', onTouchMove);
    window.addEventListener('touchend', onTouchEnd);

    controllerAudioFeedback.init();
}

function remove() {
    removeTouchCircles();
    network = null;
    window.removeEventListener('touchstart', onTouchStart);
    window.removeEventListener('touchmove', onTouchMove);
    window.removeEventListener('touchend', onTouchEnd);

    controllerAudioFeedback.remove();
}

module.exports = {
    init   : init,
    remove : remove
};