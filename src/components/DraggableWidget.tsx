import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DraggableWidgetProps {
  id: string;
  children: React.ReactNode;
  isEditMode: boolean;
  onRemove?: () => void;
}

export const DraggableWidget = ({ id, children, isEditMode, onRemove }: DraggableWidgetProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: !isEditMode });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative">
      {isEditMode && (
        <>
          <div
            {...attributes}
            {...listeners}
            className="absolute -left-2 top-1/2 -translate-y-1/2 z-10 cursor-grab active:cursor-grabbing bg-primary/10 hover:bg-primary/20 rounded-md p-1 transition-colors"
          >
            <GripVertical className="h-5 w-5 text-primary" />
          </div>
          {onRemove && (
            <Button
              variant="destructive"
              size="icon"
              className="absolute -right-2 -top-2 z-10 h-6 w-6 rounded-full"
              onClick={onRemove}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </>
      )}
      <div className={isEditMode ? 'pl-4' : ''}>
        {children}
      </div>
    </div>
  );
};
