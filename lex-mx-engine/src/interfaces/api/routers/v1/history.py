from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional
from datetime import date
from uuid import UUID
from src.interfaces.api.dependencies import SessionDep
from src.infrastructure.repository import TemporalRepository
from src.domain.schemas.norma import UnidadOutput, VersionOutput
from src.domain.models import UnidadEstructural, VersionContenido

router = APIRouter()

@router.get("/articulos/{uuid}", response_model=UnidadOutput)
async def get_articulo_temporal(
    uuid: UUID,
    fecha: date = Query(default_factory=date.today, description="Fecha de consulta (YYYY-MM-DD)"),
    session: SessionDep = None
):
    """
    Obtiene la versión de una unidad estructural vigente en la fecha especificada.
    Si no se especifica fecha, usa la fecha actual.
    """
    repo = TemporalRepository(session)
    result = await repo.get_unidad_by_date(uuid, fecha)

    if not result:
        raise HTTPException(
            status_code=404,
            detail=f"Unidad no encontrada o sin vigencia activa en la fecha {fecha}"
        )

    unidad: UnidadEstructural = result[0]
    version: VersionContenido = result[1]

    return UnidadOutput(
        uuid=unidad.uuid,
        tipo=unidad.tipo_unidad,
        version_activa=VersionOutput(
            id=version.id,
            texto_contenido=version.texto_contenido,
            vigencia_inicio=version.vigencia.lower,
            vigencia_fin=version.vigencia.upper,
            nomenclatura_visible=version.nomenclatura_visible
        )
    )
