import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
// import { formatarDuracao } from '../utils/formatters'; // <-- REMOVIDO

// Ícones customizados e correção do ícone padrão do Leaflet
const entregadorIcon = new L.Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41] });
const entregaIcon = new L.Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41] });
// const fornecedorIcon = new L.Icon({...}); // <-- REMOVIDO

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});


// --- COMPONENTE DE MAPA PARA RASTREAMENTO ---
const MapaRastreamento = ({ pedido }) => {
    const [posicaoEntregador, setPosicaoEntregador] = useState(null);
    const [posicaoEntrega, setPosicaoEntrega] = useState(null);
    const [rota, setRota] = useState(null);
    const [rotaInfo, setRotaInfo] = useState(null);

    useEffect(() => {
        const getCoordsEntrega = async () => {
            try {
                const res = await api.get(`/geocode/?address=${pedido.rua},${pedido.numero},${pedido.cep}`);
                setPosicaoEntrega([res.data.lat, res.data.lon]);
            } catch {
                console.error("Não foi possível geocodificar o endereço de entrega.");
            }
        };
        getCoordsEntrega();
    }, [pedido]);

    useEffect(() => {
        if (!posicaoEntrega || !pedido.entregador) return;

        const buscarLocalizacaoERota = async () => {
            try {
                const resLoc = await api.get(`/entregador/localizacao/${pedido.entregador.id}/`);
                const posEntregador = [resLoc.data.latitude, resLoc.data.longitude];
                setPosicaoEntregador(posEntregador);

                const resRota = await api.post('/rota-simples/', {
                    ponto_a: [posEntregador[1], posEntregador[0]],
                    ponto_b: [posicaoEntrega[1], posicaoEntrega[0]],
                });
                
                setRotaInfo(resRota.data);
                const rotaInvertida = resRota.data.geometria.map(p => [p[1], p[0]]);
                setRota(rotaInvertida);

            } catch { /* Erro silencioso se a API falhar */ }
        };

        buscarLocalizacaoERota();
        const intervalId = setInterval(buscarLocalizacaoERota, 20000); // Atualiza a cada 20 segundos

        return () => clearInterval(intervalId);
    }, [pedido, posicaoEntrega]);

    if (!posicaoEntrega) return <p>Gerando mapa de rastreamento...</p>;

    return (
        <div style={{marginTop: '15px'}}>
            {rotaInfo && (
                <div>
                    <p><strong>Distância Restante:</strong> {rotaInfo.distancia} km</p>
                    <p><strong>Tempo Estimado de Chegada:</strong> {rotaInfo.duracao} min</p>
                </div>
            )}
            <MapContainer center={posicaoEntrega} zoom={14} style={{ height: '250px', width: '100%' }}>
                <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                <Marker position={posicaoEntrega} icon={entregaIcon}><Popup>Seu Endereço</Popup></Marker>
                {posicaoEntregador && <Marker position={posicaoEntregador} icon={entregadorIcon}><Popup>Posição do Entregador</Popup></Marker>}
                {rota && <Polyline positions={rota} color="blue" />}
            </MapContainer>
        </div>
    );
};


function AcompanharPedidoPage() {
    const { pedidoId } = useParams();
    const [pedido, setPedido] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchPedido = useCallback(async () => {
        if (!pedidoId) return;
        setLoading(true);
        try {
            const response = await api.get(`/pedidos/${pedidoId}/`);
            setPedido(response.data);
        } catch (err) {
            setError('Não foi possível carregar os detalhes do pedido.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [pedidoId]);

    useEffect(() => {
        fetchPedido();
    }, [fetchPedido]);

    if (loading) return <p>Carregando acompanhamento do pedido...</p>;
    if (error) return <p style={{ color: 'red' }}>{error}</p>;
    if (!pedido) return <p>Pedido não encontrado.</p>;
    
    return (
        <div>
            <h2>Acompanhamento do Pedido #{String(pedido.id).substring(0, 8)}</h2>
            <p><strong>Status:</strong> {pedido.status}</p>
            <p><strong>Endereço de Entrega:</strong> {`${pedido.rua}, ${pedido.numero}, ${pedido.cep} ${pedido.complemento ? `- ${pedido.complemento}` : ''}`}</p>
            {pedido.entregador && <p><strong>Entregador:</strong> {pedido.entregador.profile.nome_completo}</p>}
            
            {pedido.status === 'A_CAMINHO' && pedido.codigo_confirmacao && (
                <div style={{border: '2px solid red', padding: '10px', marginTop: '15px'}}>
                    <p><strong>Código de Confirmação para a Entrega:</strong></p>
                    <h3 style={{letterSpacing: '5px'}}>{pedido.codigo_confirmacao}</h3>
                    <p>Informe este código ao entregador no momento em que receber os produtos.</p>
                </div>
            )}
            
            {pedido.status === 'A_CAMINHO' && (
                <MapaRastreamento pedido={pedido} />
            )}
        </div>
    );
}

export default AcompanharPedidoPage;