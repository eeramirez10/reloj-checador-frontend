import type { ReactNode } from 'react'
import EmptyState from './empty-state'
import PageHeader from './page-header'

type ModulePlaceholderProps = {
  title: string
  description: string
  emptyTitle: string
  emptyDescription: string
  icon: ReactNode
}

function ModulePlaceholder({ title, description, emptyTitle, emptyDescription, icon }: ModulePlaceholderProps) {
  return (
    <>
      <PageHeader title={title} description={description} />
      <EmptyState icon={icon} title={emptyTitle} description={emptyDescription} />
    </>
  )
}

export default ModulePlaceholder
