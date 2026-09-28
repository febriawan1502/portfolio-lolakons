import * as THREE from 'three';

export function createEffects(scene, curves) {
  const group = new THREE.Group(); scene.add(group);
  const particleGeo = new THREE.BoxGeometry(.13, .13, .13);
  const particleMat = new THREE.MeshBasicMaterial({ color: 0xbafbe4 });
  const particles = [];
  curves.forEach(({ curve, id }) => {
    for (let i = 0; i < 4; i++) {
      const mesh = new THREE.Mesh(particleGeo, particleMat);
      mesh.visible = false;
      group.add(mesh);
      particles.push({ mesh, curve, id, offset: i / 4 });
    }
  });
  const sparks = new THREE.Group(); scene.add(sparks);
  const sparkMat = new THREE.MeshBasicMaterial({ color: 0xd5ffdf });
  const sparkPool = Array.from({ length: 28 }, () => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(.07, .07, .07), sparkMat);
    mesh.visible = false; sparks.add(mesh);
    return { mesh, life: 0, velocity: new THREE.Vector3() };
  });
  function burst(position) {
    sparkPool.forEach((spark, i) => {
      const a = i * 2.39996;
      spark.mesh.position.copy(position).add(new THREE.Vector3(Math.cos(a) * .2, Math.sin(a * 2) * .5 + 1.8, Math.sin(a) * .2));
      spark.velocity.set(Math.cos(a) * (1 + i % 4), .6 + (i % 5) * .35, Math.sin(a) * (1 + i % 3));
      spark.life = .55 + (i % 5) * .09;
      spark.mesh.visible = true;
    });
  }
  function update(time, delta, poweredIds) {
    particles.forEach(p => {
      p.mesh.visible = poweredIds.has(p.id);
      if (p.mesh.visible) {
        const t = (time * .28 + p.offset) % 1;
        p.mesh.position.copy(p.curve.getPoint(t));
        const size = .7 + Math.sin(t * Math.PI) * .7;
        p.mesh.scale.setScalar(size);
      }
    });
    sparkPool.forEach(s => {
      if (s.life <= 0) return;
      s.life -= delta;
      s.mesh.position.addScaledVector(s.velocity, delta);
      s.velocity.y -= 4 * delta;
      s.mesh.scale.setScalar(Math.max(.01, s.life));
      s.mesh.visible = s.life > 0;
    });
  }
  return { burst, update };
}
