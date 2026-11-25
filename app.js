(() => {
  const announcer = document.getElementById("sr-announcer");
  const players = document.querySelectorAll("[data-player]");

  const formatTime = seconds => {
    if (!Number.isFinite(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  };

  const announce = message => {
    announcer.textContent = "";
    window.setTimeout(() => { announcer.textContent = message; }, 20);
  };

  players.forEach((shell, index) => {
    const video = shell.querySelector("video");
    const play = shell.querySelector(".play-btn");
    const seek = shell.querySelector(".seek");
    const time = shell.querySelector(".time-btn");
    const mute = shell.querySelector(".mute-btn");
    const volume = shell.querySelector(".volume");
    const captions = shell.querySelector(".captions-btn");
    const fullscreen = shell.querySelector(".fullscreen-btn");
    const track = video.textTracks[0];

    // Keep native caption rendering available, but start with captions off unless default is set.
    if (track) track.mode = "hidden";

    const updateTime = () => {
      const current = formatTime(video.currentTime);
      const duration = formatTime(video.duration);
      time.textContent = `${current} / ${duration}`;
      seek.value = video.duration ? (video.currentTime / video.duration) * 100 : 0;
      seek.setAttribute("aria-valuetext", `${current} of ${duration}`);
    };

    const updatePlayButton = (announceState = false) => {
      const playing = !video.paused && !video.ended;
      play.textContent = playing ? "❚❚" : "▶";
      play.setAttribute("aria-label", playing ? "Pause video" : "Play video");
      if (announceState) announce(playing ? "Video playing" : "Video paused");
    };

    const togglePlay = () => video.paused ? video.play() : video.pause();

    play.addEventListener("click", togglePlay);

    video.addEventListener("play", () => updatePlayButton(true));
    video.addEventListener("pause", () => updatePlayButton(true));
    video.addEventListener("timeupdate", updateTime);
    video.addEventListener("loadedmetadata", updateTime);
    video.addEventListener("ended", () => {
      updatePlayButton(true);
      announce("Video ended");
    });

    seek.addEventListener("input", () => {
      if (video.duration) video.currentTime = (Number(seek.value) / 100) * video.duration;
    });
    seek.addEventListener("change", () => announce(`Video position ${formatTime(video.currentTime)}`));

    volume.addEventListener("input", () => {
      video.volume = Number(volume.value);
      video.muted = video.volume === 0;
      mute.textContent = video.muted ? "🔇" : "🔊";
      mute.setAttribute("aria-label", video.muted ? "Unmute video" : "Mute video");
      announce(`Volume ${Math.round(video.volume * 100)} percent`);
    });

    mute.addEventListener("click", () => {
      video.muted = !video.muted;
      mute.textContent = video.muted ? "🔇" : "🔊";
      mute.setAttribute("aria-label", video.muted ? "Unmute video" : "Mute video");
      announce(video.muted ? "Video muted" : "Video unmuted");
    });

    captions.addEventListener("click", () => {
      if (!track) return;
      const on = track.mode !== "showing";
      track.mode = on ? "showing" : "hidden";
      captions.classList.toggle("active", on);
      captions.setAttribute("aria-label", on ? "Turn captions off" : "Turn captions on");
      announce(on ? "Captions on" : "Captions off");
    });

    fullscreen.addEventListener("click", async () => {
      try {
        if (!document.fullscreenElement) {
          await shell.requestFullscreen();
          fullscreen.setAttribute("aria-label", "Exit fullscreen");
          announce("Fullscreen entered");
        } else {
          await document.exitFullscreen();
          fullscreen.setAttribute("aria-label", "Enter fullscreen");
          announce("Fullscreen exited");
        }
      } catch {
        announce("Fullscreen is not available in this browser");
      }
    });

    document.addEventListener("fullscreenchange", () => {
      const active = document.fullscreenElement === shell;
      fullscreen.setAttribute("aria-label", active ? "Exit fullscreen" : "Enter fullscreen");
    });

    // Keyboard shortcuts work when focus is on the player controls.
    shell.addEventListener("keydown", e => {
      const tag = document.activeElement.tagName;
      if (tag === "INPUT") {
        if (e.key === " " || e.key === "Enter") return;
      }
      if ([" ", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "m", "M", "c", "C", "f", "F"].includes(e.key)) {
        e.preventDefault();
      }

      switch (e.key) {
        case " ":
          togglePlay();
          break;
        case "ArrowLeft":
          video.currentTime = Math.max(0, video.currentTime - 5);
          announce(`Rewound to ${formatTime(video.currentTime)}`);
          break;
        case "ArrowRight":
          video.currentTime = Math.min(video.duration || Infinity, video.currentTime + 5);
          announce(`Forward to ${formatTime(video.currentTime)}`);
          break;
        case "ArrowUp":
          video.volume = Math.min(1, video.volume + 0.1);
          volume.value = video.volume;
          video.muted = false;
          announce(`Volume ${Math.round(video.volume * 100)} percent`);
          break;
        case "ArrowDown":
          video.volume = Math.max(0, video.volume - 0.1);
          volume.value = video.volume;
          video.muted = video.volume === 0;
          announce(`Volume ${Math.round(video.volume * 100)} percent`);
          break;
        case "m":
        case "M":
          mute.click();
          break;
        case "c":
        case "C":
          captions.click();
          break;
        case "f":
        case "F":
          fullscreen.click();
          break;
      }
    });

    // Allow clicking the video itself to play/pause.
    video.addEventListener("click", togglePlay);
    updateTime();
    updatePlayButton(false);
  });

  announce("Accessible yoga video library ready");
})();
