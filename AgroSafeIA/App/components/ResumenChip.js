import React from 'react';
import { Chip, useTheme } from 'react-native-paper';

const ResumenChip = ({ icon, label, value }) => {
    const theme = useTheme();
    return (
        <Chip
            icon={icon}
            style={{
                marginRight: 8,
                backgroundColor: theme.colors.surfaceVariant,
            }}
            textStyle={{ fontWeight: "600" }}
        >
            {label}: {value}
        </Chip>
    );
};

export default ResumenChip;