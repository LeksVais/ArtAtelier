import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Card,
  CardContent,
  Typography,
  Chip,
  IconButton,
  Box,
} from '@mui/material';
import {
  MoreVert as MoreIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  Flag as FlagIcon,
} from '@mui/icons-material';
import { formatDate } from '../../utils/helpers';

const SortableTaskCard = ({ task, onMenuClick, onClick, priorityColors }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id.toString(), data: { task, status: task.status } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: 'grab',
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      sx={{
        mb: 2,
        '&:hover': { boxShadow: 3 },
        userSelect: 'none',
      }}
      onClick={onClick}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
            {task.title}
          </Typography>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onMenuClick(e, task);
            }}
          >
            <MoreIcon />
          </IconButton>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {task.project?.title}
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip
              icon={<ScheduleIcon />}
              label={formatDate(task.deadline)}
              size="small"
              variant="outlined"
            />
            <Chip
              icon={<PersonIcon />}
              label={task.assigned_to?.full_name || 'Не назначен'}
              size="small"
              variant="outlined"
            />
          </Box>
          <FlagIcon sx={{ color: priorityColors[task.priority] }} />
        </Box>
      </CardContent>
    </Card>
  );
};

export default SortableTaskCard;