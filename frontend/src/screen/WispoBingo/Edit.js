import React, { useState, useRef, useEffect } from 'react';
import Input from '../../component/Input';
import Button from '../../component/Button';
import Group from '../../component/Group';
import Form from '../../component/Form';
import api from '../../api';

export default function WispoBingoEdit({ token }) {
    const [items, setItems] = useState(null);
    const itemsRef = useRef(null);

    const data = useRef({
        created: {},
        updated: {},
        deleted: [],
    });
    const nextId = useRef(-1);

    useEffect(() => {
        api.get('wispo_bingo/').then(({ data }) => {
            setItems(data);
        });
    }, []);

    if (items === null) {
        return null;
    }

    function createItem() {
        const id = nextId.current--;
        data.current.created[id] = '';
        setItems([...items, { id, description: '' }])
    }

    function deleteItem(index) {
        const item = items[index];
        if (item.id < 0) {
            delete data.current.created[item.id];
        } else {
            delete data.current.updated[item.id];
            data.current.deleted.push(item.id);
        }
        setItems([
            ...items.slice(0, index),
            ...items.slice(index + 1),
        ]);
    }

    let itemNodes = items.map((item, i) => (
        <Input
            key={i}
            autoFocus={i === 0}
            placeholder={`Optie ${i + 1}`}
            value={item.description}
            onChange={(description) => {
                if (item.id < 0) {
                    data.current.created[item.id] = description;
                } else {
                    data.current.updated[item.id] = description;
                }
                setItems([
                    ...items.slice(0, i),
                    { ...item, description },
                    ...items.slice(i + 1),
                ]);
            }}
            onDelete={() => deleteItem(i)}
            onKeyDown={(e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();

                    function focusNext() {
                        const node = itemsRef.current;
                        node.children[i + 2].children[0].focus();
                    }

                    if (i === items.length - 1) {
                        createItem();
                        setTimeout(focusNext, 0);
                    } else {
                        focusNext();
                    }
                } else if (
                    e.key === 'Backspace' &&
                    item.name === ''
                ) {
                    e.preventDefault();

                    deleteItem(i);
                    const node = itemsRef.current;
                    node.children[i === 0 ? i + 1 : i].children[0].focus();
                }
            }}
        />
    ));

    return (
        <>
            <h2>Wispo Bingo Aanpassen</h2>
            <Form onSubmit={async (e) => {
                e.preventDefault();
                const { data: newItems } = await api.post(`wispo_bingo/edit/${token}/`, {
                    created: Object.values(data.current.created),
                    updated: data.current.updated,
                    deleted: data.current.deleted,
                });
                data.current = {
                    created: {},
                    updated: {},
                    deleted: [],
                };
                setItems(newItems);
            }}>
                <Group label="Opties" innerRef={itemsRef}>
                    {itemNodes}
                    <Button onClick={() => createItem()}>
                        Optie Toevoegen
                    </Button>
                </Group>
                <Button primary type="submit">Opslaan</Button>
            </Form>
        </>
    );
}
