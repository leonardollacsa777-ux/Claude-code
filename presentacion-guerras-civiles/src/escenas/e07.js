/**
 * Escena 7 — El asesinato de Francisco Pizarro (26 de junio de 1541).
 * Lima de noche: el palacio, las antorchas y las siluetas que entran.
 */

import {
  Group, Mesh, BoxGeometry, CylinderGeometry, ConeGeometry,
  MeshStandardMaterial, PointLight, Color,
} from 'three';
import { crearCiudad } from '../mundo/ciudad.js';
import { crearEjercito } from '../mundo/soldados.js';
import { crearParticulas } from '../mundo/particulas.js';
import { crearLetrero } from '../mundo/letrero.js';
import { LUGARES } from '../data/lugares.js';
import { alturaEn } from '../mundo/relieve.js';

export default {
  id: 7,
  crear(mundo, R) {
    const grupo = new Group();
    grupo.name = 'escena-7';

    const L = LUGARES.lima;
    const suelo = alturaEn(L.x, L.z);

    const ciudad = crearCiudad({
      centro: [L.x, L.z], radio: 13, casas: 58, sembrado: 71, giro: -0.2,
    });
    grupo.add(ciudad);

    // El palacio del gobernador, mas alto que las casas.
    const palacio = new Group();
    palacio.position.set(L.x - 1, suelo, L.z - 3);
    const muro = new MeshStandardMaterial({
      color: new Color('#D9CCB4'), roughness: 0.9, flatShading: true,
    });
    const teja = new MeshStandardMaterial({
      color: new Color('#7E4127'), roughness: 0.88, flatShading: true,
    });

    const cuerpo = new Mesh(new BoxGeometry(11, 5.4, 8), muro);
    cuerpo.position.y = 2.7;
    palacio.add(cuerpo);

    const techo = new Mesh(new ConeGeometry(8, 2.2, 4), teja);
    techo.rotation.y = Math.PI / 4;
    techo.position.y = 6.4;
    techo.scale.set(1, 1, 0.78);
    palacio.add(techo);

    // Columnas del portal.
    for (let i = -2; i <= 2; i++) {
      const col = new Mesh(new CylinderGeometry(0.28, 0.32, 3.6, 8), muro);
      col.position.set(i * 2.1, 1.8, 4.2);
      palacio.add(col);
    }

    // Ventanas encendidas.
    const ventana = new MeshStandardMaterial({
      color: new Color('#FFC46B'),
      emissive: new Color('#FF9A3C'),
      emissiveIntensity: 1.8,
      roughness: 0.6,
    });
    for (let i = -1; i <= 1; i++) {
      const v = new Mesh(new BoxGeometry(1.2, 1.6, 0.15), ventana);
      v.position.set(i * 3.2, 3.3, 4.05);
      palacio.add(v);
    }
    grupo.add(palacio);
    mundo.registrar('palacioLima', palacio);

    // Antorchas: luz calida y parpadeante.
    const antorchas = [];
    const maderaMat = new MeshStandardMaterial({ color: new Color('#3A2A18'), roughness: 0.9 });
    const llamaMat = new MeshStandardMaterial({
      color: new Color('#FFD08A'), emissive: new Color('#FF8A2E'), emissiveIntensity: 2.6,
    });
    for (const [dx, dz] of [[-6.5, 4.6], [6.5, 4.6], [-9, -1], [9, -1], [0, 9]]) {
      const a = new Group();
      const x = L.x - 1 + dx;
      const z = L.z - 3 + dz;
      a.position.set(x, alturaEn(x, z), z);

      const palo = new Mesh(new CylinderGeometry(0.09, 0.11, 3, 5), maderaMat);
      palo.position.y = 1.5;
      a.add(palo);

      const llama = new Mesh(new ConeGeometry(0.34, 0.9, 6), llamaMat);
      llama.position.y = 3.3;
      a.add(llama);

      const luz = new PointLight(0xffa04a, 34, 26, 1.8);
      luz.position.y = 3.4;
      a.add(luz);

      grupo.add(a);
      antorchas.push({ grupo: a, luz, llama, fase: Math.random() * 6.28 });
    }

    // Los almagristas entrando: siluetas oscuras.
    const asaltantes = crearEjercito({
      centro: [L.x - 1, L.z + 14],
      rumbo: Math.PI,
      cantidad: 22, ancho: 7, fondo: 4,
      color: '#14171F', arma: 'espada', escala: 0.95, sembrado: 72,
    });
    grupo.add(asaltantes);

    const rotulo = crearLetrero('26 de junio de 1541', {
      alto: 2.6, color: '#F2E3BC',
    });
    rotulo.position.set(L.x, suelo + 15, L.z);
    grupo.add(rotulo);
    R.letreros.push(rotulo);

    const brasas = crearParticulas('brasas', {
      origen: [L.x, suelo + 4, L.z], sembrado: 73, cantidad: 60,
    });
    grupo.add(brasas.puntos);

    return {
      grupo,
      activar({ efectos }) { efectos.clima(null); },
      desactivar() {},
      animar(t, dt, activa) {
        if (!activa) return;
        for (const a of antorchas) {
          const p = 0.72 + Math.sin(t * 9 + a.fase) * 0.18 + Math.sin(t * 21 + a.fase) * 0.1;
          a.luz.intensity = 34 * p;
          a.llama.scale.set(1, 0.85 + p * 0.3, 1);
        }
        // Avanzan despacio hacia el palacio.
        const avance = Math.min(11, (t % 26) * 0.9);
        asaltantes.userData.colocar(avance, t * 1.2);
        brasas.animar(dt);
        brasas.ajustarNiebla(mundo.escena.fog);
      },
    };
  },
};
