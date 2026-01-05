import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Ícones customizados
const entregadorIcon = new L.Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41] });
const fornecedorIcon = new L.Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41] });
const entregaIcon = new L.Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41] });

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Componente auxiliar para recentralizar o mapa quando a posição muda
const RecenterMap = ({ lat, lng }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng]);
  }, [lat, lng, map]);
  return null;
};

// COMPONENTE DE MAPA PARA A ENTREGA ATIVA
const MapaEntregaAtiva = ({ pedido, posicaoAtual }) => {
    const [posicaoEntrega, setPosicaoEntrega] = useState(null);
    const [rota, setRota] = useState(null);

    useEffect(() => {
        const calcularRota = async () => {
            if (!posicaoAtual || !pedido) return;
            try {
                const enderecoEntrega = `${pedido.rua}, ${pedido.numero}, ${pedido.cep}`;
                const coordsEntregaRes = await api.get(`/geocode/?address=${encodeURIComponent(enderecoEntrega)}`);
                const coordsEntrega = coordsEntregaRes.data;
                setPosicaoEntrega([coordsEntrega.lat, coordsEntrega.lon]);

                const resRota = await api.post('/rota-simples/', {
                    ponto_a: [posicaoAtual[1], posicaoAtual[0]], // lon, lat
                    ponto_b: [coordsEntrega.lon, coordsEntrega.lat], // lon, lat
                });

                const rotaInvertida = resRota.data.geometria.map(p => [p[1], p[0]]); // Inverte para lat, lon
                setRota(rotaInvertida);
            } catch (err) {
                console.error("Erro ao calcular rota da entrega ativa:", err);
            }
        };
        calcularRota();
    }, [posicaoAtual, pedido]);

    if (!posicaoEntrega) return <p>Calculando rota para a entrega...</p>;

    return (
        <MapContainer center={posicaoAtual} zoom={15} style={{ height: '300px', width: '100%', marginTop: '15px' }}>
            <RecenterMap lat={posicaoAtual[0]} lng={posicaoAtual[1]} />
            <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
            <Marker position={posicaoAtual} icon={entregadorIcon}><Popup>Sua Posição</Popup></Marker>
            <Marker position={posicaoEntrega} icon={entregaIcon}><Popup>Destino da Entrega</Popup></Marker>
            {rota && <Polyline positions={rota} color="green" />}
        </MapContainer>
    );
};

function EntregadorDashboard() {
    const [posicaoAtual, setPosicaoAtual] = useState(null);
    const [pedidos, setPedidos] = useState([]);
    const [pedidoAceito, setPedidoAceito] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [codigoConfirmacao, setCodigoConfirmacao] = useState('');
    const itemRefs = useRef(new Map());
    const mapRef = useRef();
    const { accessToken } = useAuth();
    
    // Estados para a rota de visualização (antes de aceitar)
    const [rotaAtiva, setRotaAtiva] = useState(null);
    const [marcadorEntregaAtivo, setMarcadorEntregaAtivo] = useState(null);
    const [pedidoAtivoId, setPedidoAtivoId] = useState(null);

    const primeiroItem = (p) => p?.itens_pedido?.[0];

    useEffect(() => {
        const watchId = navigator.geolocation.watchPosition(
            async (pos) => {
                const novaPosicao = [pos.coords.latitude, pos.coords.longitude];
                setPosicaoAtual(novaPosicao);
                
                // Se tiver entrega ativa, envia localização para o backend
                if (pedidoAceito) {
                    try {
                        await api.post('/entregador/atualizar-localizacao/', {
                            latitude: novaPosicao[0],
                            longitude: novaPosicao[1],
                        });
                    } catch (err) { console.error("Erro ao enviar localização.", err); 
                        console.error("Erro ao enviar localizacao", err);
                    }
                }
            },
            (err) => {
                setError('Não foi possível obter sua localização. Por favor, ative a permissão.');
                setLoading(false);
                console.error(err);
            }, { enableHighAccuracy: true }
        );
        return () => navigator.geolocation.clearWatch(watchId);
    }, [pedidoAceito]); // Dependência importante: atualiza o comportamento quando aceita pedido

    const fetchData = useCallback(async () => {
        if (!accessToken) return;
        setLoading(true);
        try {
            // 1. Verifica se já tem pedido em andamento
            const resPedidoAtivo = await api.get('/pedidos/?status=A_CAMINHO');
            if (resPedidoAtivo.data.length > 0) {
                setPedidoAceito(resPedidoAtivo.data[0]);
                setPedidos([]);
            } else {
                // 2. Se não, busca os disponíveis
                const resPedidosDisponiveis = await api.get('/pedidos-disponiveis/');
                const pedidosComCoordenadas = await Promise.all(
                    resPedidosDisponiveis.data.map(async (pedido) => {
                        const perfilFornecedor = primeiroItem(pedido)?.produto?.fornecedor?.profile;
                        const enderecoFornecedor = perfilFornecedor 
                            ? `${perfilFornecedor.rua}, ${perfilFornecedor.numero}, ${perfilFornecedor.cidade}` 
                            : null;

                        if (enderecoFornecedor) {
                            try {
                                const coordsRes = await api.get(`/geocode/?address=${encodeURIComponent(enderecoFornecedor)}`);
                                return { ...pedido, coordsFornecedor: [coordsRes.data.lat, coordsRes.data.lon] };
                            } catch {
                                // CORREÇÃO: Usa 'pedido' aqui, não 'p'
                                return { ...pedido, coordsFornecedor: null };
                            }
                        }
                        // CORREÇÃO: Usa 'pedido' aqui, não 'p'
                        return { ...pedido, coordsFornecedor: null };
                    })
                );
                setPedidos(pedidosComCoordenadas);
                setPedidoAceito(null);
            }
        } catch (err) {
            setError('Não foi possível carregar os dados.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [accessToken]);

    useEffect(() => {
        fetchData();
    }, [accessToken, fetchData]);

    const handleVerRota = async (pedidoId) => {
        if (!posicaoAtual) return alert("Sua localização ainda não foi obtida.");
        
        const pedidoAlvo = pedidos.find(p => p.id === pedidoId);
        if (!pedidoAlvo || !pedidoAlvo.coordsFornecedor) return alert("Coordenadas de coleta não encontradas.");

        try {
            const enderecoEntrega = `${pedidoAlvo.rua}, ${pedidoAlvo.numero}, ${pedidoAlvo.cep}`;
            const coordsEntregaRes = await api.get(`/geocode/?address=${encodeURIComponent(enderecoEntrega)}`);
            const coordsEntrega = coordsEntregaRes.data;

            const resRota = await api.post('/calcular-rota/', {
                ponto_a: [posicaoAtual[1], posicaoAtual[0]],
                ponto_b: [pedidoAlvo.coordsFornecedor[1], pedidoAlvo.coordsFornecedor[0]],
                ponto_c: [coordsEntrega.lon, coordsEntrega.lat],
            });

            // Reseta rotas de outros pedidos e define a nova
            setPedidos(pedidos.map(p => 
                p.id === pedidoId ? { ...p, rota: resRota.data } : { ...p, rota: null }
            ));
            
            const rotaInvertida = resRota.data.geometria.map(p => [p[1], p[0]]);
            setRotaAtiva(rotaInvertida);
            setMarcadorEntregaAtivo([coordsEntrega.lat, coordsEntrega.lon]);
            setPedidoAtivoId(pedidoId);
        } catch (err) {
            alert('Não foi possível calcular a rota.');
            console.error(err);
        }
    };

    const handleAceitarPedido = async (pedidoId) => {
        if (window.confirm("Aceitar este pedido para entrega?")) {
            try {
                const response = await api.post(`/pedidos-disponiveis/${pedidoId}/aceitar_pedido/`);
                alert('Pedido aceito com sucesso!');
                setPedidoAceito(response.data);
                setPedidos([]);
                setRotaAtiva(null);
                setMarcadorEntregaAtivo(null);
                setPedidoAtivoId(null);
            } catch (err) {
                alert(err.response?.data?.error || 'Erro ao aceitar o pedido.');
            }
        }
    };

    const handleMarkerClick = (pedidoId) => {
        const elemento = itemRefs.current.get(pedidoId);
        if (elemento) {
            elemento.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    const handleConfirmarEntrega = async (e) => {
        e.preventDefault();
        if (!codigoConfirmacao || codigoConfirmacao.length !== 4) {
            alert("Por favor, insira o código de 4 dígitos.");
            return;
        }
        try {
            await api.post(`/pedidos/${pedidoAceito.id}/confirmar_entrega/`, { codigo: codigoConfirmacao });
            alert("Entrega confirmada com sucesso!");
            setCodigoConfirmacao('');
            fetchData(); // Volta a buscar novos pedidos
        } catch (err) {
            alert(err.response?.data?.error || 'Erro ao confirmar a entrega.');
        }
    };
    
    if (loading) return <p>Carregando painel...</p>;
    if (error) return <p style={{ color: 'red' }}>{error}</p>;

    // MODO "EM ENTREGA"
    if (pedidoAceito) {
        return (
            <div>
                <h2>Entrega em Andamento</h2>
                <h4>Pedido #{String(pedidoAceito.id).substring(0, 8)}</h4>
                <p><strong>Destino:</strong> {`${pedidoAceito.rua}, ${pedidoAceito.numero}`}</p>
                <p><strong>Condomínio:</strong> {pedidoAceito.sindico.profile.nome_condominio}</p>
                
                {posicaoAtual ? (
                    <MapaEntregaAtiva pedido={pedidoAceito} posicaoAtual={posicaoAtual} />
                ) : (
                    <p>Aguardando sua localização para mostrar o mapa...</p>
                )}
                
                <form onSubmit={handleConfirmarEntrega} style={{ marginTop: '20px' }}>
                    <input 
                        type="text" 
                        value={codigoConfirmacao}
                        onChange={(e) => setCodigoConfirmacao(e.target.value)}
                        placeholder="Código de 4 dígitos" 
                        maxLength="4"
                        style={{ marginRight: '10px' }}
                    />
                    <button type="submit">Confirmar Entrega</button>
                </form>
            </div>
        );
    }

    // MODO "PROCURANDO PEDIDOS"
    return (
        <div>
            <h2>Pedidos Disponíveis</h2>
            {posicaoAtual && (
                <MapContainer ref={mapRef} center={posicaoAtual} zoom={13} style={{ height: '300px', width: '100%', marginBottom: '20px' }}>
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                    <Marker position={posicaoAtual} icon={entregadorIcon}><Popup>Você está aqui</Popup></Marker>
                    
                    {!pedidoAtivoId && pedidos.filter(p => p.coordsFornecedor).map(pedido => (
                        <Marker key={pedido.id} position={pedido.coordsFornecedor} icon={fornecedorIcon} eventHandlers={{ click: () => handleMarkerClick(pedido.id) }}>
                            <Popup>Coleta do Pedido #{String(pedido.id).substring(0,8)}</Popup>
                        </Marker>
                    ))}

                    {pedidoAtivoId && pedidos.filter(p => p.id === pedidoAtivoId).map(pedido => (
                        <React.Fragment key={`active-markers-${pedido.id}`}>
                            {pedido.coordsFornecedor && <Marker position={pedido.coordsFornecedor} icon={fornecedorIcon}><Popup>Coleta</Popup></Marker>}
                            {marcadorEntregaAtivo && <Marker position={marcadorEntregaAtivo} icon={entregaIcon}><Popup>Entrega</Popup></Marker>}
                        </React.Fragment>
                    ))}
                    
                    {rotaAtiva && <Polyline positions={rotaAtiva} color="blue" />}
                </MapContainer>
            )}
            
            {!posicaoAtual && <p>Por favor, ative a permissão de localização.</p>}
            
            <ul style={{ listStyleType: 'none', padding: 0 }}>
                {pedidos.length === 0 && !loading ? (<p>Nenhum pedido disponível para retirada no momento.</p>) : (
                    pedidos.map(pedido => (
                        <li 
                            key={pedido.id} 
                            ref={el => itemRefs.current.set(pedido.id, el)}
                            style={{ border: '1px solid #ccc', padding: '15px', margin: '10px 0' }}
                        >
                            <h4>Pedido #{String(pedido.id).substring(0, 8)}</h4>
                            <p><strong>Condomínio:</strong> {pedido.sindico?.profile?.nome_condominio || 'Não informado'}</p>
                            <p><strong>Complemento:</strong> {pedido.complemento || 'Nenhum'}</p>
                            
                            {pedido.rota ? (
                                <>
                                    <p><strong>Distância Total:</strong> {pedido.rota.distancia} km</p>
                                    <p><strong>Tempo Estimado:</strong> {pedido.rota.duracao} min</p>
                                    <button onClick={() => handleAceitarPedido(pedido.id)}>
                                        Aceitar Pedido
                                    </button>
                                </>
                            ) : (
                                <button onClick={() => handleVerRota(pedido.id)}>
                                    Ver Rota e Distância
                                </button>
                            )}
                        </li>
                    ))
                )}
            </ul>
        </div>
    );
}

export default EntregadorDashboard;