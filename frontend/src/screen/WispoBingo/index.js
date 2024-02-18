import React, { useState, useCallback, useEffect } from 'react';
import styled from 'styled-components';
import useLocalState from '../../helpers/useLocalState';
import theme from '../../theme';
import Button from '../../component/Button';
import Modal from '../../component/Modal';
import BINGO from './bingo.png';
import api from '../../api';

const NoCard = styled.p`
    font-style: italic;
    text-align: center;
    color: ${theme.textColorN2};
    margin: 2rem 0;
`;

const CenteredP = styled.p`
    text-align: center;
`;

const Cards = styled.div`
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    grid-auto-rows: auto;
    grid-gap: 0.5rem;
    margin-bottom: 1rem;
    position: relative;
`;

const Card = styled.div`
    position: relative;
    border-radius: 0.5rem;
    cursor: pointer;
    ${({ checked }) => checked ? `
        background-color: ${theme.bgColorN1};
        color: ${theme.bgColorP2};
        text-decoration: line-through;
        transform: scale(0.95);
    ` : `
        background-color: ${theme.bgColorP1};
        color: ${theme.textColorP2};
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.125);
    `}
    transition:
        background-color 300ms ease,
        color 300ms ease,
        transform 300ms ease,
        box-shadow 300ms ease;
    &:after {
        content: '';
        display: block;
        padding-bottom: 100%;
    }
    > * {
        z-index: 1;
        position: absolute;
        left: 0.25rem;
        top: 50%;
        width: calc(100% - 0.5rem);
        transform: translateY(-50%);
        text-align: center;
        font-size: 0.66rem;
    }
`;

const Bingo = styled.img`
    pointer-events: none;
    z-index: 2;
    position: absolute;
    left: 50%;
    top: 50%;
    width: 80vw;
    height: 80vw;
    object-fit: contain;
    ${({ active }) => active ? `
        transform: translate(-50%, -50%) rotate(10deg);
    ` : `
        transform: translate(-50%, -50%) rotate(-80deg) scale(0);
        opacity: 0;
    `};
    transition: transform 1200ms ease, opacity 1200ms ease;
`;

function shuffle(cards) {
    for (let i = 0; i < cards.length - 1; i++) {
        const j = i + Math.floor(Math.random() * (cards.length - i));
        const temp = cards[i];
        cards[i] = cards[j];
        cards[j] = temp;
    }
}

export default function WispoBingo() {
    const [items, setItems] = useState(null);
    const [cards, setCards] = useLocalState('wispo-bingo-cards', null);
    const [randomOpen, setRandomOpen] = useState(false);

    const setRandomCards = useCallback(() => {
        const cards = items.map(({ description: text }) => ({ text, checked: false }));
        while (cards.length > 16) {
            const i = Math.floor(Math.random() * cards.length);
            cards.splice(i, 1);
        }
        shuffle(cards);
        setCards(cards);
    }, [items, setCards]);

    const openRandomModal = useCallback(() => setRandomOpen(true), [setRandomOpen]);
    const closeRandomModal = useCallback(() => setRandomOpen(false), [setRandomOpen]);
    const acceptRandomModal = useCallback(() => {
        closeRandomModal();
        setRandomCards();
    }, [closeRandomModal, setRandomCards]);

    useEffect(() => {
        api.get('wispo_bingo/').then(({ data }) => {
            if (data.length >= 16) {
                setItems(data);
            }
        });
    }, []);

    return (
        <>
            <h2>Wispo Bingo</h2>
            {cards === null ? (
                <NoCard>Je hebt nog geen bingokaart.</NoCard>
            ) : (
                <Cards>
                    {cards.map(({ text, checked }, i) => (
                        <Card key={i} checked={checked} onClick={() => setCards([
                            ...cards.slice(0, i),
                            { ...cards[i], checked: !checked },
                            ...cards.slice(i + 1),
                        ])}>
                            <div>{text}</div>
                        </Card>
                    ))}
                    <Bingo
                        src={BINGO}
                        active={cards.every(({ checked }) => checked)}
                    />
                </Cards>
            )}
            {items !== null && (
                <>
                    <Button icon="random" onClick={cards === null ? setRandomCards : openRandomModal}>
                        Random Kaart
                    </Button>
                    <Modal title="Random Kaart" open={randomOpen} onClose={closeRandomModal}>
                        <CenteredP>Weet je zeker dat je huidige kaart weg wilt gooien?</CenteredP>
                        <Button onClick={acceptRandomModal}>Ja</Button>
                    </Modal>
                </>
            )}
        </>
    );
}
