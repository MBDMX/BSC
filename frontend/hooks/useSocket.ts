import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

export function useSocket() {
    const socket = useRef<Socket | null>(null);

    useEffect(() => {
        // Connexion au serveur websocket
        socket.current = io('http://localhost:3000');

        socket.current.on('connect', () => {
            console.log('Connected to websocket server');
        });

        socket.current.on('stock_changed', (data) => {
            // Mettre à jour le state global ou les données locales
            console.log('Stock updated:', data);
        });

        return () => {
            if (socket.current) {
                socket.current.disconnect();
            }
        };
    }, []);

    const emitStockUpdate = (data: any) => {
        if (socket.current) {
            socket.current.emit('stock_update', data);
        }
    };

    return { emitStockUpdate };
}
