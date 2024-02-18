import React from 'react';
import WispoBingoEditScreen from '../screen/WispoBingo/Edit';

export default function WispoBingoEdit({ match }) {
    const { token } = match.params;
    return <WispoBingoEditScreen token={token} />;
}
