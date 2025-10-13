Form house-style
=================

This document describes the project-wide form "house style" used across the web app.

Principles
----------
- Clear hierarchy: labels are small and muted; values are larger and bold so data is easy to scan.
- Consistent control height: inputs and selects share the same height and focus ring.
- Responsive: stacked labels on small screens; denser 2-column grids on desktop for compact areas.
- Accessibility: labels use `htmlFor` and inputs use `id`, `aria-invalid` for errors.

Tokens (recommended)
--------------------
- Label: `text-xs text-slate-400 uppercase tracking-wider leading-none`
- Value: `text-lg font-semibold text-slate-900`
- Control base: use `Input` tokens (h-9, rounded-md, border-input, focus-visible:ring)`
- Vertical rhythm: `gap-y-1` / `py-1` for dense rows; `py-2` for larger sections

Components
----------
- Input: `components/ui/input.tsx` (canonical project input with focus rings)
- Select: `components/ui/select.tsx` (matches Input tokens)
- Label: `components/ui/label.tsx`
- LabelValue: small helper that places label above control on small screens and left-aligned at md+ if desired. We also provide a compact stacked version used on Identity and Summary.

How to use
----------
One-off example (JSX):

```tsx
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';

function FieldExample(){
  return (
    <div className="flex flex-col gap-1 py-0.5">
      <div className="text-xs text-slate-400 uppercase tracking-wider leading-none">Date of birth</div>
      <div className="mt-1">
        <Input className="text-lg font-semibold" type="date" />
      </div>
    </div>
  );
}
```

Preview
-------
See `/app/dev/form-style` while running the dev server for an interactive preview that demonstrates the tokens and spacing.
