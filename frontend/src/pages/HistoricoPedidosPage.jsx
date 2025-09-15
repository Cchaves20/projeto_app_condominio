import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { formatarDuracao } from '../utils/formatters'; // Importa a função de formatação

// Ícones customizados e correção do ícone padrão do Leaflet
const entregadorIcon = new L.Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41] });
const entregaIcon = new L.Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41] });
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
                    ponto_a: [posEntregador[1], posEntregador[0]], // lon, lat
                    ponto_b: [posicaoEntrega[1], posicaoEntrega[0]], // lon, lat
                });
                
                setRotaInfo(resRota.data);
                const rotaInvertida = resRota.data.geometria.map(p => [p[1], p[0]]);
                setRota(rotaInvertida);

            } catch { /* Erro silencioso se a API falhar */ }
        };

        buscarLocalizacaoERota();
        const intervalId = setInterval(buscarLocalizacaoERota, 20000);

        return () => clearInterval(intervalId);
    }, [pedido, posicaoEntrega]);

    if (!posicaoEntrega) return <p>Gerando mapa de rastreamento...</p>;

    return (
        <div style={{marginTop: '15px'}}>
            {rotaInfo && (
                <div>
                    <p><strong>Distância Restante:</strong> {rotaInfo.distancia} km</p>
                    {/* Usa a função importada para formatar o tempo */}
                    <p><strong>Tempo Estimado de Chegada:</strong> {formatarDuracao(parseFloat(rotaInfo.duracao) * 60)}</p>
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


function HistoricoPedidosPage() {
    const [pedidos, setPedidos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchPedidos = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get('/pedidos/');
            setPedidos(response.data);
        } catch (err) {
            setError('Não foi possível carregar o histórico de pedidos.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPedidos();
    }, [fetchPedidos]);

    if (loading) return <p>Carregando histórico de pedidos...</p>;
    if (error) return <p style={{ color: 'red' }}>{error}</p>;
    
    return (
        <div>
            <h2>Histórico de Pedidos</h2>
            {pedidos.length === 0 ? (
                <p>Você ainda não fez nenhum pedido.</p>
            ) : (
                <ul style={{ listStyleType: 'none', padding: 0 }}>
                    {pedidos.map(pedido => (
                        <li key={pedido.id} style={{ border: '1px solid #ccc', padding: '15px', marginBottom: '15px' }}>
                            <div>
                                <strong>Pedido #{String(pedido.id).substring(0, 8)}</strong>
                                <span style={{ marginLeft: '15px' }}>Data: {new Date(pedido.data_pedido).toLocaleDateString()}</span>
                                <br />
                                <span>Status: {pedido.status}</span>
                                <br />
                                {pedido.entregador && <p><strong>Entregador:</strong> {pedido.entregador.profile.nome_completo}</p>}
                                <strong>Total: R$ {pedido.valor_total}</strong>
                            </div>
                            
                            {pedido.status === 'A_CAMINHO' && (
                                <MapaRastreamento pedido={pedido} />
                            )}

                            <div style={{ marginTop: '10px' }}>
                                <strong>Itens Comprados:</strong>
                                <ul>
                                    {pedido.itens_pedido.map(item => (
                                        <li key={item.id}>
                                            {item.quantidade}x {item.nome_produto}
                                            <span style={{ color: '#555' }}> (Vendido por: {item.nome_fornecedor})</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default HistoricoPedidosPage;