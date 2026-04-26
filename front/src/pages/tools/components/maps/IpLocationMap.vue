<template>
  <div class="ip-location-map">
    <div ref="wrapElement" class="ip-location-map__wrap">
      <div
        ref="mapElement"
        class="ip-location-map__canvas"
        :style="mapCanvasStyle"
        :aria-label="`${profile.city} 位置地图`"
      >
        <div v-if="!canShowMap" class="ip-location-map__empty">
          {{ profile.loading ? '正在获取坐标…' : '暂无可绘制坐标' }}
        </div>
        <button
          class="ip-location-map__recenter"
          type="button"
          :disabled="!canShowMap"
          aria-label="重新定位到当前 IP 位置"
          title="重新定位"
          @click.stop="recenterMap"
          @pointerdown.stop
        >
          <svg class="ip-location-map__control-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm8.94 3A9.01 9.01 0 0 0 13 3.06V1h-2v2.06A9.01 9.01 0 0 0 3.06 11H1v2h2.06A9.01 9.01 0 0 0 11 20.94V23h2v-2.06A9.01 9.01 0 0 0 20.94 13H23v-2h-2.06ZM12 19a7 7 0 1 1 0-14 7 7 0 0 1 0 14Z" />
          </svg>
        </button>
        <button
          class="ip-location-map__resize"
          type="button"
          aria-label="拖动调整地图大小"
          title="拖动调整地图大小"
          @pointerdown="startResize"
        >
          <svg class="ip-location-map__resize-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 15h2v2H5v-2Zm4 0h2v2H9v-2Zm4 0h2v2h-2v-2Zm4 0h2v2h-2v-2ZM9 19h2v2H9v-2Zm4 0h2v2h-2v-2Zm4 0h2v2h-2v-2Z" />
          </svg>
        </button>
      </div>
      <div class="ip-location-map__footer">
        <span>坐标</span>
        <strong>{{ profile.coordinates }}</strong>
      </div>
    </div>
  </div>
</template>

<script src="./IpLocationMap.js"></script>
<style scoped src="./IpLocationMap.css"></style>
