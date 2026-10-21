import SyncAltRoundedIcon from '@mui/icons-material/SyncAltRounded'
import ModulePlaceholder from '../shared/ui/module-placeholder'

function SynchronizationPage() {
  return (
    <ModulePlaceholder
      description="Revisa la actividad reciente de sincronización de checadas y empleados de los relojes."
      emptyDescription="Cuando ejecutes una sincronización, su resultado, duración y cantidad de registros aparecerán aquí."
      emptyTitle="Aún no hay sincronizaciones"
      icon={<SyncAltRoundedIcon fontSize="medium" />}
      title="Sincronización"
    />
  )
}

export default SynchronizationPage
