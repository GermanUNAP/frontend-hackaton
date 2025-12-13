import React, { useState, useRef } from 'react';
import './Ritual.css';
import { Link } from 'react-router-dom';

type ItemDef = { id: string; type: string; label: string; tooltip: string; image?: string };

const availableItems: ItemDef[] = [
  { id: 'papa', type: 'food', label: 'Papa', tooltip: 'Representa la tierra y la cosecha.', image: '/imgs/papa.webp' },
  { id: 'queso', type: 'food', label: 'Queso', tooltip: 'Producto de la ganadería local.', image: '/imgs/queso.png' },
  { id: 'mandarina', type: 'fruit', label: 'Mandarina', tooltip: 'Fruta para agradecer la abundancia.', image: '/imgs/mandarina.png' },
  { id: 'pinia', type: 'fruit', label: 'Piña', tooltip: 'Fruta para agradecer la abundancia.', image: '/imgs/pinia.png' },
  { id: 'platano', type: 'fruit', label: 'Plátano', tooltip: 'Fruta para agradecer la abundancia.', image: '/imgs/platano.png' },
  { id: 'wine1', type: 'wine', label: 'Copa de vino', tooltip: 'Copa de vino - debe colocarse a la izquierda.', image: '/imgs/vaso-vino.png' },
  { id: 'wine2', type: 'wine', label: 'Copa de vino', tooltip: 'Copa de vino - debe colocarse a la derecha.', image: '/imgs/vaso-vino.png' },
  { id: 'coca', type: 'coca', label: 'Hojas de coca', tooltip: 'Hojas de coca - elemento central del ritual.', image: '/imgs/hojas-coca.png' },
];

const SCALES: { [k: string]: number } = { papa: 1, queso: 1, mandarina: 1, pinia: 1, platano: 1, wine1: 1, wine2: 1, coca: 1 };

const Ritual: React.FC = () => {
  const [showModal, setShowModal] = useState(true);
  const [placed, setPlaced] = useState<any[]>([]);
  const [placeholders, setPlaceholders] = useState<{ [k: string]: ItemDef | null }>({
    wineLeft: null,
    wineRight: null,
    coca: null,
  });
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null);
  const [finished, setFinished] = useState(false);
  const dropRef = useRef<HTMLDivElement | null>(null);

  const onDragStart = (e: React.DragEvent, item: ItemDef) => {
    // dragging from the item bar (new item)
    e.dataTransfer.setData('application/my-app', JSON.stringify({ placed: false, item }));
  };

  const onPlacedDragStart = (e: React.DragEvent, placedItem: any) => {
    // dragging an already-placed item
    e.dataTransfer.setData('application/my-app', JSON.stringify({ placed: true, id: placedItem.id, item: placedItem }));
  };

  const removePlaced = (id: string) => {
    setPlaced((p) => p.filter((it) => it.id !== id));
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dataRaw = e.dataTransfer.getData('application/my-app');
    if (!dataRaw) return;
    const payload = JSON.parse(dataRaw);
    const target = (e.target as HTMLElement).closest('[data-placeholder]') as HTMLElement | null;

    // Determine the item object regardless of source
    const item: ItemDef = payload.item;

    if (target && target.dataset && target.dataset.placeholder) {
      const ph = target.dataset.placeholder;
      // Enforce required placements
      if (ph === 'wineLeft' || ph === 'wineRight') {
        if (item.type !== 'wine') {
          alert('En este lugar se requiere una copa de vino.');
          return;
        }
        setPlaceholders((p) => ({ ...p, [ph]: item }));
        // if a placed instance was used, remove it from free-placed list
        if (payload.placed) setPlaced((p) => p.filter((it) => it.id !== payload.id));
        return;
      }
      if (ph === 'coca') {
        if (item.type !== 'coca') {
          alert('En este lugar se requieren hojas de coca.');
          return;
        }
        setPlaceholders((p) => ({ ...p, coca: item }));
        if (payload.placed) setPlaced((p) => p.filter((it) => it.id !== payload.id));
        return;
      }
    }

    // Free placement or reposition on blanket: compute position relative to drop area
    if (dropRef.current) {
      const rect = dropRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (payload.placed) {
        // reposition existing placed item
        setPlaced((p) => p.map((it) => (it.id === payload.id ? { ...it, x, y } : it)));
      } else {
        // place new item from bar
        setPlaced((p) => [...p, { ...item, originalId: item.id, x, y, id: item.id + '-' + Date.now() }]);
      }
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleFinish = () => {
    if (!placeholders.wineLeft || !placeholders.wineRight || !placeholders.coca) {
      alert('Faltan elementos obligatorios: asegúrate de colocar dos copas de vino (una a cada lado) y las hojas de coca en el centro.');
      return;
    }
    setFinished(true);
  };

  return (
    <div className="ritual-container">
      <header className="ritual-header">
        <h1>Ritual de Agradecimiento</h1>
        <Link to="/" className="game-button small">Volver</Link>
      </header>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Instrucciones</h2>
            <p>Coloca dos copas de vino en los lados y las hojas de coca en el centro. Arrastra otros objetos si lo deseas.</p>
            <button className="game-button" onClick={() => setShowModal(false)}>Comenzar</button>
          </div>
        </div>
      )}
      <main className="ritual-main">
        <div
          className="blanket"
          ref={dropRef}
          onDrop={onDrop}
          onDragOver={onDragOver}
          style={{
            backgroundImage: "linear-gradient(rgba(255,248,220,0.6), rgba(245,222,179,0.6)), url('/imgs/lliclla.jpg')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className={`placeholder left ${placeholders.wineLeft ? 'occupied' : ''}`} data-placeholder="wineLeft">
            {placeholders.wineLeft ? <img src={placeholders.wineLeft.image} alt={placeholders.wineLeft.label} className="placeholder-img" style={{ transform: `scale(${SCALES[placeholders.wineLeft.id] || 1})` }} /> : <div className="ph-label">Copa de vino (izq)</div>}
          </div>

          <div className={`placeholder center ${placeholders.coca ? 'occupied' : ''}`} data-placeholder="coca">
            {placeholders.coca ? <img src={placeholders.coca.image} alt={placeholders.coca.label} className="placeholder-img" style={{ transform: `scale(${SCALES[placeholders.coca.id] || 1})` }} /> : <div className="ph-label">Hojas de coca (centro)</div>}
          </div>

          <div className={`placeholder right ${placeholders.wineRight ? 'occupied' : ''}`} data-placeholder="wineRight">
            {placeholders.wineRight ? <img src={placeholders.wineRight.image} alt={placeholders.wineRight.label} className="placeholder-img" style={{ transform: `scale(${SCALES[placeholders.wineRight.id] || 1})` }} /> : <div className="ph-label">Copa de vino (der)</div>}
          </div>

          {placed.map((it) => {
            const originalId = it.originalId || (it.id ? it.id.split('-')[0] : undefined);
            const scale = SCALES[originalId || ''] || 1;
            return (
              <div
                key={it.id}
                className="placed absolute"
                style={{ left: it.x - 20 + 'px', top: it.y - 20 + 'px' }}
                draggable
                onDragStart={(e) => onPlacedDragStart(e, it)}
                onDoubleClick={() => removePlaced(it.id)}
                onMouseEnter={(e) => setTooltip({ text: it.tooltip, x: e.clientX + 10, y: e.clientY + 10 })}
                onMouseMove={(e) => setTooltip((t) => (t ? { ...t, x: e.clientX + 10, y: e.clientY + 10 } : t))}
                onMouseLeave={() => setTooltip(null)}
              >
                <img src={it.image} alt={it.label} className="placed-img" style={{ transform: `scale(${scale})` }} />
              </div>
            );
          })}

          {tooltip && (
            <div className="tooltip" style={{ left: tooltip.x, top: tooltip.y }}>
              {tooltip.text}
            </div>
          )}
        </div>

        <aside className="item-bar">
          <h3>Objetos</h3>
          <div className="items">
            {availableItems.map((it) => (
              <div
                key={it.id}
                className="bar-item"
                draggable
                onDragStart={(e) => onDragStart(e, it)}
                onMouseEnter={(e) => setTooltip({ text: it.tooltip, x: e.clientX + 10, y: e.clientY + 10 })}
                onMouseMove={(e) => setTooltip((t) => (t ? { ...t, x: e.clientX + 10, y: e.clientY + 10 } : t))}
                onMouseLeave={() => setTooltip(null)}
              >
                <img src={it.image} alt={it.label} className="bar-item-img" />
                <div className="bar-label">{it.label}</div>
              </div>
            ))}
          </div>

          <button className="finish-button" onClick={handleFinish}>Terminé el ritual</button>

          {finished && (
            <div className="congrats">
              <h3>¡Felicidades!</h3>
              <p>Has completado el Ritual de Agradecimiento.</p>
              <p>Significado general: (texto de ejemplo) Este ritual es una ofrenda para agradecer a la Pachamama por la cosecha y la vida. Puedes reemplazar este texto con tu propia explicación más detallada.</p>
            </div>
          )}
        </aside>
      </main>
    </div>
  );
};

export default Ritual;
