<template>
  <div class="fixed top-0 left-0 -z-10 h-full w-full overflow-hidden">
    <video
      src="https://xcivjcecfkgbhoojwovd.supabase.co/storage/v1/object/sign/misc/deliveroo-background.mp4?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8wY2VlYTllZC02M2IxLTQwNTMtOGY2ZS04NzBiYjE3YWNjZGEiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJtaXNjL2RlbGl2ZXJvby1iYWNrZ3JvdW5kLm1wNCIsImlhdCI6MTc3OTU2ODI3NCwiZXhwIjoxODExMTA0Mjc0fQ.HPYw0tHg1Z8_lQpMx06OPuuiYFIQDB13w0jv-zHsJPY"
      autoplay
      loop
      muted
      playsinline
      class="h-full w-full object-cover"
    ></video>
    <div class="absolute top-0 left-0 h-full w-full bg-white/80 dark:bg-black/80"></div>
  </div>
</template>

<style scoped>
.video-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
  overflow: hidden;
}

.video-background__video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.video-background__overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.3);
}
</style>
