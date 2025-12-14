import React, { useState, useRef } from 'react';
import './Ritual.css';
import { Link } from 'react-router-dom';
import html2canvas from 'html2canvas';
import { FaShare } from 'react-icons/fa';

type ItemDef = { id: string; type: string; label: string; tooltip: string; image?: string };

const availableItems: ItemDef[] = [
  { id: 'papa', type: 'food', label: 'Papa', tooltip: 'Representa la tierra y la cosecha.', image: '/imgs/papa.webp' },
  { id: 'queso', type: 'food', label: 'Queso', tooltip: 'Producto de la ganadería local.', image: '/imgs/queso.png' },
  { id: 'mandarina', type: 'fruit', label: 'Mandarina', tooltip: 'Fruta para agradecer la abundancia.', image: '/imgs/mandarina.png' },
  { id: 'pinia', type: 'fruit', label: 'Piña', tooltip: 'Fruta para agradecer la abundancia.', image: '/imgs/pinia.png' },
  { id: 'platano', type: 'fruit', label: 'Plátano', tooltip: 'Fruta para agradecer la abundancia.', image: '/imgs/platano.png' },
  { id: 'wine', type: 'wine', label: 'Copa de vino', tooltip: 'Copa de vino - colócala en una de las dos posiciones fijas.', image: '/imgs/vaso-vino.png' },
  { id: 'coca', type: 'coca', label: 'Hojas de coca', tooltip: 'Hojas de coca - puedes colocarla libremente.', image: '/imgs/hojas-coca.png' },
];

const SCALES: { [k: string]: number } = { papa: 1.25, queso: 1.5, mandarina: 0.9, pinia: 2.5, platano: 2.25, wine: 2.5, coca: 1.7 };

const Ritual: React.FC = () => {
  const [showModal, setShowModal] = useState(true);
  const [placed, setPlaced] = useState<any[]>([]);
  const [placeholders, setPlaceholders] = useState<{ [k: string]: ItemDef | null }>({
    wineLeft: null,
    wineRight: null,
  });

  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null);
  const [finished, setFinished] = useState(false);
  const dropRef = useRef<HTMLDivElement | null>(null);
  const [notice, setNotice] = useState<{ title?: string; text: string; button?: string } | null>(null);
  const [imageData, setImageData] = useState<string | null>(null);

  const reset = () => {
    setPlaced([]);
    setPlaceholders({ wineLeft: null, wineRight: null });
    setFinished(false);
    setTooltip(null);
    setNotice(null);
  };

  const dataURLToBlob = (dataURL: string) => {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)![1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  };

  const onDragStart = (e: React.DragEvent, item: ItemDef) => {
    // dragging from the item bar (new item)
    e.dataTransfer.setData('application/my-app', JSON.stringify({ placed: false, item }));
    try {
      const scale = SCALES[item.id] || 1;
      const img = new Image();
      const div = document.createElement('div');
      img.src = item.image || '';
      const base = 60;
      const w = Math.round(base * scale);
      img.style.width = w + 'px';
      img.style.height = 'auto';
      div.style.position = 'absolute';
      div.style.left = '-9999px';
      div.style.top = '-9999px';
      div.style.display = 'flex';
      div.style.alignItems = 'center';
      div.style.justifyContent = 'center';
      div.appendChild(img);
      document.body.appendChild(div);
      e.dataTransfer.setDragImage(div, Math.round(w / 2), Math.round(w / 2));
      setTimeout(() => { if (div.parentNode) div.parentNode.removeChild(div); }, 0);
    } catch (err) {
      // ignore
    }
  };

  const onPlacedDragStart = (e: React.DragEvent, placedItem: any) => {
    // dragging an already-placed item
    e.dataTransfer.setData('application/my-app', JSON.stringify({ placed: true, id: placedItem.id, item: placedItem }));
    try {
      const originalId = placedItem.originalId || (placedItem.id ? placedItem.id.split('-')[0] : '');
      const img = new Image();
      const div = document.createElement('div');
      img.src = placedItem.image || '';
      const scale = SCALES[originalId] || 1;
      const base = 60;
      const w = Math.round(base * scale);
      img.style.width = w + 'px';
      img.style.height = 'auto';
      div.style.position = 'absolute';
      div.style.left = '-9999px';
      div.style.top = '-9999px';
      div.style.display = 'flex';
      div.style.alignItems = 'center';
      div.style.justifyContent = 'center';
      div.appendChild(img);
      document.body.appendChild(div);
      e.dataTransfer.setDragImage(div, Math.round(w / 2), Math.round(w / 2));
      setTimeout(() => { if (div.parentNode) div.parentNode.removeChild(div); }, 0);
    } catch (err) {
      // ignore
    }
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
      // Enforce cup placements: only wine allowed in fixed spots
      if (ph === 'wineLeft' || ph === 'wineRight') {
        if (item.type !== 'wine') {
          setNotice({ title: 'Ubicación incorrecta', text: 'Aquí solo se puede colocar una copa de vino. Colócala en una de las posiciones fijas (1/3 y 2/3 del ancho).', button: 'Aceptar' });
          return;
        }
        setPlaceholders((p) => ({ ...p, [ph]: item }));
        // if a placed instance was used, remove it from free-placed list
        if (payload.placed) setPlaced((p) => p.filter((it) => it.id !== payload.id));
        return;
      }
    }

    // Free placement or reposition on blanket: compute position relative to drop area
    if (dropRef.current) {
      const rect = dropRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // prevent free placement of cups: they must go into the fixed placeholders
      if (item.type === 'wine' && !(target && target.dataset && (target.dataset.placeholder === 'wineLeft' || target.dataset.placeholder === 'wineRight'))) {
        setNotice({ title: 'Posición requerida', text: 'Las copas deben colocarse en las posiciones fijas (1/3 y 2/3 del ancho) sobre la manta.', button: 'Entendido' });
        return;
      }

      if (payload.placed) {
        // reposition existing placed item (but prevent moving cups out of placeholders)
        const existing = placed.find((it) => it.id === payload.id);
        if (existing && existing.type === 'wine') {
          setNotice({ title: 'Acción no permitida', text: 'Las copas deben permanecer en sus posiciones fijas y no pueden moverse.', button: 'Entendido' });
          return;
        }
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
    const cupsPlaced = (!!placeholders.wineLeft ? 1 : 0) + (!!placeholders.wineRight ? 1 : 0);
    const cocaCount = placed.filter((it) => (it.originalId === 'coca' || (it.id && it.id.startsWith('coca-')) || it.id === 'coca')).length;
    if (cupsPlaced < 2) {
      setNotice({ title: 'Copas faltantes', text: 'Coloca las dos copas en las posiciones fijas (1/3 y 2/3) para continuar.', button: 'Aceptar' });
      return;
    }
    if (placed.length < 1) {
      setNotice({ title: 'Objetos insuficientes', text: 'Coloca al menos un objeto libremente en la manta para completar el ritual.', button: 'Aceptar' });
      return;
    }
    setFinished(true);
  };

  const exportImage = async () => {
    if (!dropRef.current) return;
    try {
      const canvas = await html2canvas(dropRef.current, { backgroundColor: null, useCORS: true });
      const data = canvas.toDataURL('image/png');
      setImageData(data);
      const a = document.createElement('a');
      a.href = data;
      a.download = 'ritual.png';
      a.click();
    } catch (err) {
      setNotice({ title: 'Error', text: 'No se pudo exportar la imagen.', button: 'Aceptar' });
    }
  };

  const shareImage = async () => {
    if (!imageData) {
      setNotice({ title: 'Imagen no generada', text: 'Primero exporta la imagen para poder compartirla.', button: 'Aceptar' });
      return;
    }
    try {
      if (navigator.share) {
        const blob = dataURLToBlob(imageData);
        const file = new File([blob], 'ritual.png', { type: 'image/png' });
        await navigator.share({
          files: [file],
          title: 'Mi Ritual de Agradecimiento',
          text: 'Mira mi ritual completado!'
        });
      } else {
        setNotice({ title: 'Compartir no soportado', text: 'Tu navegador no soporta compartir archivos. Usa el botón de exportar para descargar la imagen.', button: 'Aceptar' });
      }
    } catch (err) {
      setNotice({ title: 'Error', text: 'No se pudo compartir la imagen.', button: 'Aceptar' });
    }
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
            <p>Coloca dos copas de vino en las posiciones fijas (1/3 y 2/3 del ancho). Coloca al menos un otro objeto (hojas de coca u otros) libremente en la manta.</p>
            <button className="game-button" onClick={() => setShowModal(false)}>Comenzar</button>
          </div>
        </div>
      )}

      {notice && (
        <div className="modal-overlay">
          <div className="modal-content">
            {notice.title && <h3>{notice.title}</h3>}
            <p>{notice.text}</p>
            <button className="game-button" onClick={() => setNotice(null)}>{notice.button || 'Aceptar'}</button>
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
            backgroundImage: "url('/imgs/lliclla.jpg')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className={`placeholder left ${placeholders.wineLeft ? 'occupied' : ''}`} data-placeholder="wineLeft">
            {placeholders.wineLeft ? <img src={placeholders.wineLeft.image} alt={placeholders.wineLeft.label} className="placeholder-img" style={{ transform: `scale(${SCALES[placeholders.wineLeft.id] || 1})` }} /> : <div className="ph-label">Copa de vino (izq)</div>}
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
          <button className="finish-button" onClick={reset} style={{marginLeft:8}}>Reiniciar</button>

          {finished && (
            <div className="congrats">
              <h3>¡Felicidades!</h3>
              <p>Has completado el Ritual de Agradecimiento.</p>
              <p>Significado general: (texto de ejemplo) Este ritual es una ofrenda para agradecer a la Pachamama por la cosecha y la vida. Puedes reemplazar este texto con tu propia explicación más detallada.</p>
              <div style={{ marginTop: 12 }}>
                <button className="finish-button" onClick={exportImage}>Exportar imagen</button>
                <button className="finish-button" onClick={shareImage} title="Compartir" style={{ marginLeft: 8 }}><FaShare /></button>
              </div>
            </div>
          )}
        </aside>
      </main>
    </div>
  );
};

export default Ritual;
