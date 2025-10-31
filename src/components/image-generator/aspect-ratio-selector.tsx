import { motion } from 'framer-motion';

interface AspectRatioSelectorProps {
  selectedRatio: string;
  onRatioChange: (ratio: string) => void;
}

const aspectRatios = [
  { value: '1:1', label: '1:1', icon: '□' },
  { value: '16:9', label: '16:9', icon: '▭' },
  { value: '9:16', label: '9:16', icon: '▯' },
  { value: '4:3', label: '4:3', icon: '▬' },
  { value: '3:4', label: '3:4', icon: '▮' }
];

export function AspectRatioSelector({ selectedRatio, onRatioChange }: AspectRatioSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="text-xs sm:text-sm font-semibold text-white uppercase">Aspect Ratio</label>
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
        {aspectRatios.map((ratio) => (
          <motion.button
            key={ratio.value}
            onClick={() => onRatioChange(ratio.value)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`px-2 py-2 sm:px-3 sm:py-2.5 rounded-md font-medium text-xs sm:text-sm transition-all flex flex-col items-center gap-1 ${
              selectedRatio === ratio.value
                ? 'bg-black text-white shadow-lg'
                : 'bg-black/20 text-white hover:bg-black/30'
            }`}
          >
            <span className="text-lg sm:text-xl">{ratio.icon}</span>
            <span className="text-xs">{ratio.label}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
