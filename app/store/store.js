/**
 * 지도 영역 상태 관리
 * 사용 컴포넌트
 *  1. canvas-setting-panel
 *  2. weather-data-panel
 */
const mapRangeStore = {
  state: {
    mapRange: "EASIA",
  },
  subscribers: [],

  subscribers(callback) {
    this.subscribers.push(callback);
  },

  notify() {
    this.subscribers.forEach((callback) => callback(this.state));
  },

  setMapRange(mapRange) {
    this.state.mapRange = mapRange;
    this.notify();
  },
};

export { mapRangeStore };
