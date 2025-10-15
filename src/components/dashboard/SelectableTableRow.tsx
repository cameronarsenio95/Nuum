interface SelectableTableRowProps {
  isSelected: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  className?: string;
}

export function SelectableTableRow({ isSelected, onToggle, children, className = '' }: SelectableTableRowProps) {
  return (
    <tr className={`${className} ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
      <td className="px-6 py-4 w-12">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggle}
          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 cursor-pointer"
          onClick={(e) => e.stopPropagation()}
        />
      </td>
      {children}
    </tr>
  );
}

interface SelectAllHeaderProps {
  checked: boolean;
  indeterminate?: boolean;
  onChange: () => void;
}

export function SelectAllHeader({ checked, indeterminate, onChange }: SelectAllHeaderProps) {
  return (
    <th className="px-6 py-3 w-12">
      <input
        type="checkbox"
        checked={checked}
        ref={(el) => {
          if (el) el.indeterminate = indeterminate || false;
        }}
        onChange={onChange}
        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 cursor-pointer"
      />
    </th>
  );
}
