export const ANIMALES = [
    {
        id: "A-001",
        nombre: "Vaca #14",
        especie: "Bovino",
        temperatura: 40.2,
        hidratacion: 74,
        caidasSemana: 0,
        ultimaAlerta: { tipo: "golpe_calor", hace: "hace 12 min", nivel: "Alta" },
    },
    {
        id: "A-002",
        nombre: "Cerdo #8",
        especie: "Porcino",
        temperatura: 38.1,
        hidratacion: 51,
        caidasSemana: 1,
        ultimaAlerta: { tipo: "deshidratacion", hace: "hace 1 h", nivel: "Media" },
    },
    {
        id: "A-003",
        nombre: "Vaca #3",
        especie: "Bovino",
        temperatura: 37.6,
        hidratacion: 88,
        caidasSemana: 0,
        ultimaAlerta: null,
    },
];

export const ALERTAS = [
    {
        id: "AL-101",
        tipo: "golpe_calor",
        animal: "Vaca #14",
        hace: "hace 12 min",
        valor: "Temp 40.2 °C",
        nivel: "Alta",
    },
    {
        id: "AL-100",
        tipo: "deshidratacion",
        animal: "Cerdo #8",
        hace: "hace 1 h",
        valor: "Hidratación 51%",
        nivel: "Media",
    },
    {
        id: "AL-099",
        tipo: "caida",
        animal: "Cerdo #8",
        hace: "hace 2 d",
        valor: "Impacto 2.3 g / 1.1 s",
        nivel: "Baja",
    },
];