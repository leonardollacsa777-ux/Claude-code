/**
 * condores.js — Los condores que acompanan a la camara en los viajes.
 *
 * Vuelan en formacion respecto de la camara (no en un punto fijo del mapa),
 * asi que siempre se ven durante el vuelo, que es justo lo que se busca.
 */

import {
  Group, Mesh, PlaneGeometry, BoxGeometry, MeshStandardMaterial,
  Color, DoubleSide, Vector3,
} from 'three';

const _adelante = new Vector3();
const _derecha = new Vector3();
const _arriba = new Vector3(0, 1, 0);
const _obj = new Vector3();

function crearCondor(escala = 1) {
  const g = new Group();

  const cuerpo = new MeshStandardMaterial({
    color: new Color('#26211C'), roughness: 0.9, flatShading: true,
  });
  const pluma = new MeshStandardMaterial({
    color: new Color('#332C25'), roughness: 0.95, side: DoubleSide, flatShading: true,
  });
  const collar = new MeshStandardMaterial({
    color: new Color('#D8CDBA'), roughness: 0.85, flatShading: true,
  });

  const torso = new Mesh(new BoxGeometry(0.34, 0.26, 1.5), cuerpo);
  g.add(torso);

  const cuello = new Mesh(new BoxGeometry(0.2, 0.18, 0.3), collar);
  cuello.position.z = 0.82;
  g.add(cuello);

  const cola = new Mesh(new PlaneGeometry(0.55, 0.7), pluma);
  cola.rotation.x = -Math.PI / 2;
  cola.position.z = -1.0;
  g.add(cola);

  const alas = [];
  for (const lado of [-1, 1]) {
    const pivote = new Group();
    const ala = new Mesh(new PlaneGeometry(2.6, 0.95), pluma);
    ala.rotation.x = -Math.PI / 2;
    ala.position.x = lado * 1.3;
    ala.position.z = -0.05;
    pivote.add(ala);
    g.add(pivote);
    alas.push({ pivote, lado });
  }

  g.scale.setScalar(escala);
  g.userData.alas = alas;
  return g;
}

export function crearCondores({ cantidad = 4 } = {}) {
  const grupo = new Group();
  grupo.name = 'condores';
  grupo.visible = false;

  const aves = [];
  const formacion = [
    { lado: -7.5, alto: -2.2, atras: 5, escala: 1.15, fase: 0 },
    { lado: 8.5, alto: -3.4, atras: 9, escala: 0.95, fase: 1.4 },
    { lado: -12, alto: -5.5, atras: 14, escala: 0.8, fase: 2.6 },
    { lado: 13, alto: -1.4, atras: 17, escala: 0.7, fase: 3.9 },
  ];

  for (let i = 0; i < Math.min(cantidad, formacion.length); i++) {
    const ave = crearCondor(formacion[i].escala);
    ave.userData.sitio = formacion[i];
    grupo.add(ave);
    aves.push(ave);
  }

  /**
   * Los coloca respecto de la camara.
   * @param camara  la camara
   * @param t       tiempo (para el aleteo)
   */
  grupo.userData.seguir = (camara, t) => {
    if (!grupo.visible) return;

    camara.getWorldDirection(_adelante);
    _derecha.crossVectors(_adelante, _arriba).normalize();

    for (const ave of aves) {
      const s = ave.userData.sitio;
      const balanceo = Math.sin(t * 0.8 + s.fase) * 1.6;

      _obj.copy(camara.position)
        .addScaledVector(_adelante, s.atras + Math.sin(t * 0.5 + s.fase) * 2)
        .addScaledVector(_derecha, s.lado + balanceo)
        .addScaledVector(_arriba, s.alto + Math.sin(t * 0.6 + s.fase * 1.7) * 1.1);

      ave.position.lerp(_obj, 0.08);

      // Mira hacia donde va la camara.
      ave.lookAt(_obj.copy(ave.position).addScaledVector(_adelante, 10));

      // Aleteo lento, como el de un condor de verdad.
      const bat = Math.sin(t * 2.1 + s.fase);
      for (const { pivote, lado } of ave.userData.alas) {
        pivote.rotation.z = lado * bat * 0.28;
      }
    }
  };

  return grupo;
}
