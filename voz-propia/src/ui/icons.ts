import {
  Activity, ArrowRight, AudioLines, Bath, Bed, Bell, Camera, Check, ChevronLeft, ChevronRight, CircleHelp,
  Download, Eye, Frown, GlassWater, Hand, HandHeart, Heart, House, Info, LayoutGrid, Lightbulb, MessageCircle,
  Mic, Moon, Music, Pencil, Phone, Pill, Play, Plus, RefreshCcw, RotateCcw, ScanFace, Settings, ShieldCheck,
  Smile, Snowflake, Sparkles, Square, Stethoscope, Sun, Thermometer, Trash2, Tv, Undo2, Upload, Utensils,
  Volume2, Wind, WifiOff, X, Zap, type IconNode,
} from 'lucide';

const ICONS: Record<string, IconNode> = {
  activity: Activity, 'arrow-right': ArrowRight, 'audio-lines': AudioLines, bath: Bath, bed: Bed, bell: Bell,
  camera: Camera, check: Check, 'chevron-left': ChevronLeft, 'chevron-right': ChevronRight, help: CircleHelp,
  download: Download, eye: Eye, frown: Frown, 'glass-water': GlassWater, hand: Hand, 'hand-heart': HandHeart,
  heart: Heart, house: House, info: Info, 'layout-grid': LayoutGrid, lightbulb: Lightbulb,
  'message-circle': MessageCircle, mic: Mic, moon: Moon, music: Music, pencil: Pencil, phone: Phone, pill: Pill,
  play: Play, plus: Plus, 'refresh-ccw': RefreshCcw, 'rotate-ccw': RotateCcw, 'scan-face': ScanFace,
  settings: Settings, 'shield-check': ShieldCheck, smile: Smile, snowflake: Snowflake, sparkles: Sparkles,
  square: Square, stethoscope: Stethoscope, sun: Sun, thermometer: Thermometer, trash: Trash2, tv: Tv,
  undo: Undo2, upload: Upload, utensils: Utensils, volume: Volume2, wind: Wind, 'wifi-off': WifiOff, x: X,
  zap: Zap,
};

const attr = (o: Record<string, string | number | undefined>) =>
  Object.entries(o)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${k}="${v}"`)
    .join(' ');

/** Devuelve el SVG del ícono como texto, listo para plantillas. */
export function icon(name: string, size = 22, stroke = 2): string {
  const node = ICONS[name] ?? MessageCircle;
  const children = node.map(([tag, a]) => `<${tag} ${attr(a as Record<string, string>)}/>`).join('');
  return `<svg class="ic" xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${children}</svg>`;
}
