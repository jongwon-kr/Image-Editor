function getLineAngle(displacementX: number, displacementY: number) {
  return Math.atan2(
    displacementY / 2 + displacementY / 2,
    displacementX / 2 + displacementX / 2
  );
}

function generateUniqueId() {
  return "shape_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
}

export { getLineAngle, generateUniqueId };
