export const tipoToUi = (tipo) => {
    switch (tipo) {
        case "golpe_calor":
            return { label: "Golpe de calor", color: "#E11D48", icon: "thermometer" };
        case "deshidratacion":
            return { label: "Deshidratación", color: "#F59E0B", icon: "water" };
        case "caida":
            return { label: "Caída", color: "#2563EB", icon: "arrow-down-bold" };
        default:
            return { label: "Alerta", color: "#6B7280", icon: "alert" };
    }
};

export const nivelToTone = (nivel) => {
    switch (nivel) {
        case "Alta":
            return { tone: "error", outline: "#FECACA" };
        case "Media":
            return { tone: "tertiary", outline: "#FDE68A" };
        default:
            return { tone: "primary", outline: "#BFDBFE" };
    }
};