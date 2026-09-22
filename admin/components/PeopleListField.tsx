"use client";
import { Plus, X } from "lucide-react";
import { Input } from "@/components/ui";

export interface Person {
  name: string;
  role: string;
}

interface Props {
  label: string;
  namePlaceholder: string;
  rolePlaceholder: string;
  items: Person[];
  onChange: (items: Person[]) => void;
}

/** Repeatable name+role row list, used for both Cast and Crew. */
export default function PeopleListField({ label, namePlaceholder, rolePlaceholder, items, onChange }: Props) {
  const update = (i: number, field: keyof Person, value: string) => {
    const next = items.slice();
    next[i] = { ...next[i], [field]: value };
    onChange(next);
  };
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));
  const add = () => onChange([...items, { name: "", role: "" }]);

  return (
    <div className="space-y-2">
      <label className="text-sm text-gray-400">{label}</label>
      {items.length > 0 && (
        <div className="space-y-2">
          {items.map((item, i) => (
            <div key={i} className="flex gap-2 items-start">
              <div className="flex-1">
                <Input placeholder={namePlaceholder} value={item.name}
                  onChange={(e) => update(i, "name", e.target.value)} />
              </div>
              <div className="flex-1">
                <Input placeholder={rolePlaceholder} value={item.role}
                  onChange={(e) => update(i, "role", e.target.value)} />
              </div>
              <button type="button" onClick={() => remove(i)}
                className="p-2.5 text-gray-500 hover:text-white flex-shrink-0" aria-label={`Remove ${label.toLowerCase()} entry`}>
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
      <button type="button" onClick={add}
        className="flex items-center gap-1.5 text-sm text-[#E50914] hover:text-[#ff2030] transition-colors">
        <Plus size={14} /> Add {label.slice(0, -1)}
      </button>
    </div>
  );
}
