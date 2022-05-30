//  for ui

let app = document.querySelector('.outter-container');
let main = document.getElementsByTagName('main')[0];
let aside = document.querySelector('.outter-container');
let menuUl = document.querySelectorAll('.menu-options');
let blackContainer = document.querySelector('#black-container');
let tweakSectionContainer = document.querySelector('.menu-tweaks');
let tweakSections = document.querySelectorAll('.tweaks');
let videoTweakValues = document.querySelectorAll('.video-tweak-value');
let tweaksShown = false;
let fsBtn = document.querySelector('#fullscreen-btn');
let input = document.createElement('input');    // to upload files
let controlsTimer = null; // for controls hide-show on mouse
let logosTimer = null; // timeout for play-pause and seek logos

// player

let bottomPlayBtn = document.querySelector('#bottom-play-btn');
let videoPlayBtn = document.querySelector('#video-play-btn');
let topVol = document.querySelector('#top-vol-input');
let loopBtn = document.querySelector('#loop-btn');
let topPlayBtn = document.querySelector('#top-play-btn');
let videoVol = document.querySelector('#video-vol-slider');
let videoMuteBtn = document.querySelector('#videoMuteBtn');
let video = document.querySelector('#input-video');    // main video element
let videoProgress = document.querySelector('#video-progress');
let bottomProgressBar = document.querySelector('#botom-seek-bar');
let bottomProgress = document.querySelector('#botom-seek');
let bottomTime = document.querySelector('#bottom-time');
let videoTime = document.querySelector('#video-time');
let playbackSpeedValue = document.querySelector('#playback-speed-value');
let pauseLogo = document.querySelector('.pause-logo');
let playLogo = document.querySelector('.play-logo');
let leftLogo = document.querySelector('.left-logo');
let rightLogo = document.querySelector('.right-logo');
let eqSliders = document.querySelectorAll('.eq-slider');
let eqSliderValues = document.querySelectorAll('.eq-slider-value');
let trackTitles = document.querySelectorAll('.track-title');
let trackDescs = document.querySelectorAll('.track-desc');
let audio = document.createElement('audio');  // main audio element

let playerValues = {
    vol: 1,
    loop: true,
    playNext: false,
    subtitle: false,
    muted: false,
    playback: 1,
    brightness: 100,
    contrast: 100,
    hue: 0,
    saturation: 100,
    eq: [0, 0, 0, 0, 0, 0, 0]
};


video.autoplay = true;
video.loop = true;
input.type = 'file';



//  events

onkeydown = e => {

    switch (e.key) {

        case 'f':
            maxFullscreen();
            break;
        case 'u':
            input.click();
            break;
        case 'm':
            asideToggle();
            break;
        case ' ':
            playPauseStream();
            break;
        case 'ArrowRight':
            skipRight();
            break;
        case 'ArrowLeft':
            skipLeft();
            break;
    }
};

input.onchange = uploadVideo;

onresize = setMaxVideoHeight;
ondblclick = maxFullscreen;

blackContainer.onmousemove = showVideoControls;
blackContainer.onmouseleave = hideVideoControls;

video.onplay = streamPlayed;
video.addEventListener('pause', streamPaused);
video.ontimeupdate = streamTimeUpdated;
audio.onplay = streamPlayed;
audio.onpaused = streamPaused;
audio.ontimeupdate = streamTimeUpdated;

videoProgress.onclick = seek;
bottomProgress.onclick = seek;

document.addEventListener('click', initAudio);

eqSliders.forEach(element => {
    element.oninput = eqSlide;
});


// observers

const resizeObserver = new ResizeObserver(entries => {
    // make the video fit to black container for any ratio

    for (let entry of entries) {
        setMaxVideoHeight(entry.contentRect.height);
    }
});

resizeObserver.observe(blackContainer);


//  upload and load video

function uploadVideo(e) {
    console.log(e.target.value)
    let file = e.target.files[0];
    let url;

    if (file) {
        url = URL.createObjectURL(file);
        video.src = url;
        console.log(file.path)
        updateTrackDetails(file.name, file.name)
        video.addEventListener('loadedmetadata', () => {
            console.log(video.textTracks)

        })
    }
}

function triggerUpload() {
    input.click();
}



//  audio manipulation

let audioSource;
let audioCtx;
let filters = [];
let boosters = [];
let compressor;

function initAudioProcessor() {

    //  create audio context on any user gesture

    audioCtx = new AudioContext();

    audioSource = audioCtx.createMediaElementSource(video);

    // create audio filters & compressor

    compressor = audioCtx.createDynamicsCompressor();
    compressor.threshold.value = -50;
    compressor.knee.value = 30;
    compressor.ratio.value = 12;
    compressor.attack.value = 0;
    compressor.release.value = 0.25;

    for(let i = 0; i < 7; i++) {

        filters[i] = audioCtx.createBiquadFilter();
        boosters[i] = audioCtx.createBiquadFilter();
    }

    for(let i = 0; i < filters.length; i++) {

        filters[i].type = "bandpass";
        boosters[i].type = "peaking";
        boosters[i].Q.value = 0.0001;

        audioSource.connect(filters[i]);
        filters[i].connect(boosters[i]);
    }
    
    filters[0].frequency.value = 90;
    boosters[0].frequency.value = 90;
    filters[0].Q.value = 0.27;

    filters[1].frequency.value = 250;
    boosters[1].frequency.value = 250;
    filters[1].Q.value = 0.27;

    filters[2].frequency.value = 500;
    boosters[2].frequency.value = 500;
    filters[2].Q.value = 0.27;
    
    filters[3].frequency.value = 1500;
    boosters[3].frequency.value = 1500;
    filters[3].Q.value = 0.27;
    
    filters[4].frequency.value = 3000;
    boosters[4].frequency.value = 3000;
    filters[4].Q.value = 0.37;

    filters[5].frequency.value = 5000;
    boosters[5].frequency.value = 5000;
    filters[5].Q.value = 0.37;
    
    filters[6].frequency.value = 8000;
    boosters[6].frequency.value = 8000;
    filters[6].Q.value = 0.27;
    
    for(let booster of boosters) {
        booster.connect(compressor);
        compressor.connect(audioCtx.destination);
    }
}

function initAudio(e) {
    initAudioProcessor();
    console.log(e);
    document.removeEventListener('click', initAudio);
}

function eqSlide(e) {

    let index = e.target.getAttribute('data-index');
    playerValues.eq[index] = parseInt(e.target.value);

    updateFilterValues();
    updateEqSliderValues();
}

function updateFilterValues() {

    for(let i = 0; i < filters.length; i++) {
        boosters[i].gain.value = playerValues.eq[i];
    }
}

function updateEqSliderValues() {

    for(let i = 0; i < eqSliderValues.length; i++) {

        eqSliderValues[i].innerHTML = playerValues.eq[i];
    }
}

//  for ui

function setMaxVideoHeight(height) {
    video.style.setProperty('--fluid-height', height + 'px');
}

setMaxVideoHeight();

function fullScreenElement() {
    return document.fullscreenElement
        || document.webkitFullscreenElement
        || document.mozFullscreenElement
        || document.msFullscreenElement;
}

function maxFullscreen() {
    if (fullScreenElement()) document.exitFullscreen().then(() => {
        exitMinFullscreen();
    });
    else app.requestFullscreen().then(() => {
        minFullscreen();
    });
    fsBtn.classList.toggle('active');
}

function minFullscreen() {
    (!main.classList.contains('fullscreen')) ? main.classList.toggle('fullscreen') : '';
    (!aside.classList.contains('hide-aside')) ? aside.classList.toggle('hide-aside') : '';
}

function exitMinFullscreen() {
    (main.classList.contains('fullscreen')) ? main.classList.toggle('fullscreen') : '';
    (aside.classList.contains('hide-aside')) ? aside.classList.toggle('hide-aside') : '';
}

function asideToggle() {
    aside.classList.toggle('hide-aside');
}

function hideVideoControls(e) {
    (!blackContainer.classList.contains('hide-controls')) ? blackContainer.classList.toggle('hide-controls') : '';
}

function showVideoControls(e) {
    if (tweaksShown) return;
    (blackContainer.classList.contains('hide-controls')) ? blackContainer.classList.toggle('hide-controls') : '';
    (controlsTimer) ? clearTimeout(controlsTimer) : '';
    controlsTimer = setTimeout(() => {
        hideVideoControls();
    }, 2000);
}

function showPauseLogo() {
    pauseLogo.style.display = 'flex';
    hideLogo(pauseLogo);
}
function showPlayLogo() {
    playLogo.style.display = 'flex';
    hideLogo(playLogo);
}
function showLeftLogo() {
    leftLogo.style.display = 'flex';
    hideLogo(leftLogo);
}
function showRightLogo() {
    rightLogo.style.display = 'flex';
    hideLogo(rightLogo);
}

function hideLogo(elem) {
    //if(logosTimer) clearTimeout(logosTimer);
    logosTimer = setTimeout(() => {
        elem.style.display = 'none';
    }, 900);
}

function hideTweaks() {
    for (let elem of tweakSections) {
        elem.style.display = 'none';
    }
    tweaksShown = false;
}

function showTweaks(index) {
    tweakSectionContainer.classList.remove('hidden');
    tweakSections[index].style.display = 'block';
    tweaksShown = true;
}

function hideTweaksContainer() {
    tweakSectionContainer.classList.add('hidden');
    tweaksShown = false;
}

function clickMenuOption(index, clickedElem) {

    tweakSectionContainer.classList.add('hidden');
    hideTweaks();
    activeSelectedMenu(clickedElem);

    if (index > 3) {
        switch (index) {
            case 4:

                break;
            case 5:

                break;
            case 6:

                break;
        }
        return;
    }

    showTweaks(index);
}

function unactiveSelectedMenu() {
    for (let elem of menuUl) {
        (elem.classList.contains('active')) ? elem.classList.toggle('active') : '';
    }
}

function activeSelectedMenu(elem) {
    unactiveSelectedMenu();
    elem.classList.add('active');
}

function btnStatePlaying() {
    videoPlayBtn.classList.remove('active');
    bottomPlayBtn.classList.remove('paused');
}

function btnStatePaused() {
    videoPlayBtn.classList.add('active');
    bottomPlayBtn.classList.add('paused');
}


//  media functions

function playPauseStream() {

    if (video.src == '') {
        triggerUpload();
        return;
    }

    if (!video.paused)
        video.pause();
    else
        video.play();

    showVideoControls();
}

function setVideoProgress() {
    videoProgress.style.setProperty('--progress', (video.currentTime / video.duration) * 100 + '%');
}

function setBottomProgress() {
    bottomProgressBar.style.width = (video.currentTime / video.duration) * 100 + '%';
}

let formatTime = function (t) {

    if (t < 60) return "00:" + pad(parseInt(t));
    else if (t > 60) return pad(parseInt((t / 60))) + ":" + pad((t % 60).toFixed(0));
    if (t == 60) return "01:00";
}

function pad(d) {


    return (d < 10) ? '0' + d.toString() : d.toString();
}

function setTime() {
    bottomTime.innerHTML = `<p>${formatTime(video.currentTime)} / ${formatTime(video.duration)}</p>`;
    videoTime.innerHTML = `<p>${formatTime(video.currentTime)} / ${formatTime(video.duration)}</p>`;
}

function seek(e) {
    let width = e.target.getBoundingClientRect().width;
    let x = e.target.getBoundingClientRect().x;
    let seekWidth = e.clientX - x;
    let seekPercentage = (seekWidth / width) * 100;
    let currentTime = (video.duration * seekPercentage) / 100;
    video.currentTime = currentTime;
}

function skipVideo(e) {
    let width = e.target.getBoundingClientRect().width;
    let left = e.target.left;

    if (e.clientX <= (left + width) / 2) {
        skipLeft();
    } else {
        skipRight();
    }
}

function skipRight() {
    video.currentTime = video.currentTime + 10;
    showRightLogo();
}

function skipLeft() {
    video.currentTime = video.currentTime - 10;
    showLeftLogo();
}

function setPlaybackSpeed(value) {
    video.playbackRate = value;
    playbackSpeedValue.innerHTML = value + ' x';
}

function loopOnOff(elem) {
    if(playerValues.loop) {
        playerValues.loop = false;
        video.loop = false;
        elem.classList.remove('red');
    } else {
        playerValues.loop = true;
        video.loop = true;
        elem.classList.add('red');
    }
}

function updateTrackDetails(title, description) {
    for(let elem of trackTitles) {
        elem.innerHTML = title;
    }
    for(let elem of trackDescs) {
        elem.innerHTML = description;
    }
}

function tweakVideo(index, value) {
    switch (index) {
        case 0:
            playerValues.brightness = value;
            break;
        case 1:
            playerValues.contrast = value;
            break;
        case 2:
            playerValues.saturation = value;
            break;
        case 3:
            playerValues.hue = value;
            break;
    }

    applyTweaks();
    updateTweakValues();
}

applyTweaks();

function applyTweaks() {
    video.style.webkitFilter = `brightness(${playerValues.brightness}%) contrast(${playerValues.contrast}%) saturate(${playerValues.saturation}%) hue-rotate(${playerValues.hue}deg)`;
}

function updateTweakValues() {
    videoTweakValues[0].innerHTML = playerValues.brightness;
    videoTweakValues[1].innerHTML = playerValues.contrast;
    videoTweakValues[2].innerHTML = playerValues.saturation;
    videoTweakValues[3].innerHTML = playerValues.hue + ' deg';
}

function setVolume(elem) {
    playerValues.vol = elem.value / 100;
    video.volume = playerValues.vol;
    unMuteVideo();
}

function muteUnmute() {
    if (!playerValues.muted) {
        muteVideo();
    } else {
        unMuteVideo();
    }
}

function muteVideo() {
    video.volume = 0;
    mutedLogo();
    playerValues.muted = true;
}

function unMuteVideo() {
    video.volume = playerValues.vol;
    unMutedLogo();
    playerValues.muted = false;
}

function mutedLogo() {

    videoMuteBtn.classList.add('active');
}

function unMutedLogo() {
    videoMuteBtn.classList.remove('active');
}

function updateVolumeSliders() {
    videoVol.value = playerValues.vol;
    topVol.value = playerValues.vol;
}

function streamPlayed(e) {

    btnStatePlaying();
    showPlayLogo();
}

function streamPaused(e) {

    btnStatePaused();
    showPauseLogo();
}

function streamTimeUpdated(e) {
    setVideoProgress();
    setBottomProgress();
    setTime();
}