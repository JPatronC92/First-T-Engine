from typing import Optional, Tuple
from uuid import UUID
from datetime import date
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from src.domain.models import UnidadEstructural, VersionContenido

class TemporalRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_unidad_by_date(self, unidad_uuid: UUID, query_date: date) -> Optional[Tuple[UnidadEstructural, VersionContenido]]:
        """
        Retrieves a structural unit and its content version active at the specified date.
        Uses PostgreSQL's range containment operator (@>).
        """
        stmt = (
            select(UnidadEstructural, VersionContenido)
            .join(VersionContenido, UnidadEstructural.uuid == VersionContenido.unidad_uuid)
            .where(UnidadEstructural.uuid == unidad_uuid)
            # The contains operator checks if the date is within the vigencia range
            .where(VersionContenido.vigencia.contains(query_date))
        )
        result = await self.session.execute(stmt)
        return result.first() # Returns (Unidad, Version) or None
