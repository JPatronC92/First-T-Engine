Esto ya es sistema serio.
Voy a auditarlo como si fuera pre-producción enterprise.

---

# 1️⃣ Evaluación General

✔ Arquitectura coherente
✔ Separación correcta entre identidad y versión
✔ Pipeline determinista
✔ Time-travel funcionando

Están en **fase pre-productiva real**, no prototipo.

Ahora lo importante: lo que puede romperse.

---

# 2️⃣ Auditoría Técnica por Capas

## A. Base de Datos (Riesgo Bajo)

PostgreSQL 16 + `DATERANGE` + `ExcludeConstraint`
Eso es diseño correcto.

Pero falta confirmar 3 cosas críticas:

### 1. ¿Tienen índice GiST sobre el daterange?

Sin esto, las consultas temporales escalan mal.

```sql
CREATE INDEX idx_vigencia_gist 
ON versiones_contenido 
USING GIST (unidad_id, daterange(fecha_inicio_vigencia, fecha_fin_vigencia));
```

---

### 2. ¿Tienen soft-delete lógico?

Nunca borren registros históricos.

Agreguen:

```sql
deleted_at TIMESTAMP NULL
```

Nunca `DELETE`, solo marcar.

---

### 3. ¿Están versionando también la estructura?

Si mañana se crea:

> “Se adiciona un Artículo 27-A Bis”

¿Dónde vive?

Si `UnidadEstructural` es estática, ya detecté un posible cuello.

Necesitan:

* Versionar también `estructura_normativa`
* O permitir inserciones ordenadas dinámicamente

---

## B. LLM Parser (Riesgo Medio)

Aquí está su único punto frágil.

Preguntas que deben poder responder:

1. ¿El JSON está validado contra schema estricto?
2. ¿Hay retries con temperatura baja?
3. ¿Guardan el raw output del LLM para auditoría?
4. ¿Logean el prompt usado?

Si mañana hay litigio, deben poder demostrar:

> “El sistema interpretó el decreto así.”

Eso es infraestructura crítica.

---

## C. Resolver Legal (Punto Clave)

Esto es lo que realmente hace único el sistema.

Pero ojo:

Resolver por texto visible es frágil.

Si el decreto dice:

> “Se reforma el artículo 27”

Y existen múltiples reformas históricas…

El resolver debe buscar:

* Unidad por nomenclatura
* Dentro de norma específica
* Con fallback por path estructural

Si no hay determinismo total aquí, el patcher puede modificar el artículo equivocado.

---

## D. Patcher Engine (Muy bien planteado)

Transacción atómica = correcto.

Pero agreguen:

* Tabla `eventos_normativos`
* Tabla `patch_log`

Ejemplo:

```sql
CREATE TABLE patch_log (
    id UUID PRIMARY KEY,
    decreto_origen TEXT,
    json_patch JSONB,
    aplicado_por TEXT,
    aplicado_en TIMESTAMP,
    hash_resultado CHAR(64)
);
```

Eso convierte el sistema en auditable.

---

# 3️⃣ Arquitectura Estratégica

Esto ya no es solo consolidación.

Ya están construyendo:

> Motor Normativo Determinista Mexicano.

Eso es diferente.

Porque ya pueden hacer:

* Query por fecha
* Query por versión
* Reconstrucción histórica completa
* Futuras simulaciones

---

# 4️⃣ Backoffice: Aquí deben invertir fuerte

No hagan Streamlit para algo permanente.

Si esto va en serio:

* React admin panel
* Diff visual estilo GitHub
* Vista triple:

  * Texto actual
  * Texto propuesto
  * JSON Patch

El humano debe editar el JSON antes de aprobar.

Eso reduce dependencia del LLM.

---

# 5️⃣ Compliance Engine (Siguiente Evolución)

Cuando entren a reglas:

No evalúen JSON con eval dinámico.

Construyan mini rule engine determinista:

```python
def evaluate_rule(contexto, regla):
    # operadores AND, OR, GT, LTE, IN
```

Nada de IA aquí.

Si meten IA en cumplimiento, pierden credibilidad.

---

# 6️⃣ Riesgos Reales

1. Erratas del DOF
2. Reformas múltiples el mismo día
3. Reformas que modifican artículos recién creados
4. Reformas retroactivas
5. Artículos transitorios que modifican vigencia condicional

Si sobreviven esos cinco escenarios, ya están en liga mayor.

---

# 7️⃣ Nivel de Madurez Actual

Esto está en:

**TRL 6–7 (Technology Readiness Level)**

Funciona en entorno controlado.
Aún no probado en guerra real diaria del DOF.

---

# 8️⃣ Siguiente Decisión Crítica

Antes de desplegar CRON automático, respondan:

¿El sistema puede detectar cuando el LLM no está seguro?

Necesitan confidence scoring o flag de ambigüedad.

Si no, el CRON puede meter errores silenciosos.

---

# Conclusión Directa

Esto ya no es hobby.
Esto es infraestructura de Estado potencial.

Si lo ejecutan bien:

* No compiten contra GPT wrappers.
* Compiten contra editoriales jurídicas tradicionales.

PROPUESTAS SUGERIDAS Y CORRECCIONES:  Esta auditoría es **oro puro**. Has elevado el estándar de "funcional" a "go-to-market".

Acepto el diagnóstico: Estamos en **TRL 6 (Prototipo funcional en entorno relevante)**. Para llegar a TRL 9 (Sistema probado en entorno real), necesitamos blindar el sistema contra la realidad sucia del DOF y la ambigüedad del lenguaje natural.

Has puesto tres opciones sobre la mesa. Mi decisión estratégica es clara:

### 🚀 Decisión: Escalamos el "Compliance Engine" (Blindaje Lógico)

**¿Por qué?**

1. **Multi-tenant** es irrelevante si el motor no entrega valor comercial real.
2. **API Pública** es solo el transporte.
3. **Compliance Engine** es el *producto*. Es lo que diferencia a Lex MX de un "buscador de leyes". Es la capacidad de responder: *"¿Esta factura es deducible HOY para este RFC?"*.

Si resolvemos el determinismo lógico, la API y el Multi-tenant son triviales.

---

### Plan de Acción Inmediato: Hardening & Compliance

Vamos a ejecutar las correcciones de tu auditoría (Punto A y B) y luego diseñar el Motor de Reglas (Punto 5).

#### 1. Hardening de Base de Datos (Tus puntos críticos)

Ejecuta este SQL en tu base de datos ahora mismo. Cubre el índice GiST y la tabla de auditoría que exigiste.

```sql
-- 1. Optimización Temporal (Tu punto A.1)
CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE INDEX IF NOT EXISTS idx_vigencia_contenido 
ON versiones_contenido 
USING GIST (unidad_uuid, vigencia); 
-- Nota: Usamos 'vigencia' que es el campo daterange

-- 2. Auditoría Forense (Tu punto D)
CREATE TABLE patch_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    decreto_fuente_url TEXT,
    patch_candidate_json JSONB NOT NULL, -- El raw del LLM
    prompt_usado TEXT, -- Para depurar alucinaciones
    confidence_score FLOAT, -- Semáforo de riesgo
    aplicado_por UUID, -- ID del usuario/admin
    aplicado_en TIMESTAMP DEFAULT NOW(),
    estado VARCHAR(20) -- 'EXITO', 'ROLLBACK', 'RECHAZADO'
);

-- 3. Soft Delete (Tu punto A.2)
ALTER TABLE versiones_contenido ADD COLUMN deleted_at TIMESTAMP NULL;

```

#### 2. Actualización del Schema (El Semáforo de Confianza)

Para mitigar el riesgo del LLM (Punto B), actualizamos `src/domain/schemas/patch.py` para incluir métricas de incertidumbre.

```python
# En PatchCandidate:
class PatchCandidate(BaseModel):
    # ... campos anteriores ...
    confidence_score: float = Field(..., ge=0, le=1, description="Nivel de certeza del modelo (0.0 - 1.0)")
    flag_ambiguedad: bool = Field(default=False, description="True si el decreto es confuso o contradictorio")
    raw_reasoning: str = Field(..., description="Cadena de pensamiento (CoT) del modelo antes de generar el JSON")

```

---

### 3. El Nuevo Core: "Compliance Engine Determinista"

Aquí es donde matamos a la competencia. No usaremos IA para evaluar reglas. Usaremos **JSON Logic**.

**La Arquitectura del Motor:**

1. **Input:** Contexto del Usuario (Factura, Régimen Fiscal, Fecha) + Regla Normativa (almacenada en DB).
2. **Proceso:** Ejecución estricta de operadores lógicos.
3. **Output:** `True` / `False` + `Motivo`.

**Diseño del Archivo: `src/domain/services/compliance_engine.py**`

```python
from typing import Dict, Any, List
from json_logic import jsonLogic # Librería estándar, cero IA
from src.domain.models import ReglaCompliance

class ComplianceEngine:
    """
    Motor determinista que evalúa reglas fiscales sin alucinaciones.
    """
    
    def evaluar_transaccion(self, contexto: Dict[str, Any], reglas: List[ReglaCompliance]) -> Dict[str, Any]:
        """
        Args:
            contexto: Datos del cliente (ej: {"regimen": "RESICO", "gasto": 2500, "metodo": "EFECTIVO"})
            reglas: Lista de reglas vigentes extraídas de la DB para la fecha de la transacción.
        """
        reporte = {
            "es_valido": True,
            "reglas_fallidas": [],
            "reglas_exitosas": []
        }
        
        for regla in reglas:
            try:
                # La magia ocurre aquí: Evaluación determinista pura
                resultado = jsonLogic(regla.logica_json, contexto)
                
                if not resultado:
                    reporte["es_valido"] = False
                    reporte["reglas_fallidas"].append({
                        "id": regla.id,
                        "nombre": regla.nombre_regla,
                        "motivo": regla.mensaje_error_template.format(**contexto)
                    })
                else:
                    reporte["reglas_exitosas"].append(regla.nombre_regla)
                    
            except Exception as e:
                # Si falla el motor, es un error de código, no de interpretación
                print(f"🔥 Error evaluando regla {regla.id}: {e}")
                reporte["es_valido"] = False
                reporte["errores_sistema"] = str(e)
                
        return reporte

```

**Ejemplo de Regla (Datos en DB):**
*Caso: Deducción de Gasolina (Debe pagarse con tarjeta si > $2,000).*

```json
{
  "nombre_regla": "Requisito Medios de Pago Gasolina",
  "logica_json": {
    "if": [
      { "and": [
          { "==": [{ "var": "tipo_gasto" }, "combustible"] },
          { ">": [{ "var": "monto" }, 2000] }
        ]
      },
      { "in": [{ "var": "metodo_pago" }, ["TARJETA_CREDITO", "TARJETA_DEBITO", "TRANSFERENCIA"]] },
      true // Si no es combustible > 2000, la regla no aplica (pasa)
    ]
  },
  "mensaje_error_template": "El gasto de combustible por ${monto} debe pagarse con medios electrónicos."
}

```

CORRECCION:  Arquitectura de Sistemas.

El cambio a un Motor Puro (Pure Function) es la decisión correcta. Nos permite testear la lógica fiscal aislada de la base de datos y garantiza que el sistema sea escalar y predecible.

Aquí tienes la refactorización nivel Enterprise: Zero-Side-Effects, Versionado Temporal y Logging Estructurado.

1. El Modelo de Datos Refactorizado (SCD Type 2 para Reglas)
Las reglas cambian. Si el SAT cambia el tope de deducción en 2027, no podemos romper las validaciones de 2026.
Mirroring exacto de la estructura de Artículos.

Archivo: src/domain/models.py (Adición)

Python
from sqlalchemy import Integer, String, Boolean
from sqlalchemy.orm import mapped_column, relationship
from sqlalchemy.dialects.postgresql import JSONB, DATERANGE, ENUM

# Enums para clasificación estricta
SeveridadRegla = ENUM('INFO', 'WARNING', 'ERROR', 'BLOCKER', name='severidad_regla')
TipoRegla = ENUM('OBLIGATORIA', 'SUGERENCIA', 'CALCULO', name='tipo_regla')

class ReglaIdentidad(Base):
    """La identidad perpetua de una regla (ej: 'Tope Deducción Gasolina')."""
    __tablename__ = "reglas_identidad"
    
    uuid: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    clave_interna: Mapped[str] = mapped_column(String, unique=True, index=True) # Ej: "ISR-DED-GAS-001"
    nombre_humano: Mapped[str] = mapped_column(String)
    
    versiones = relationship("ReglaVersion", back_populates="regla")

class ReglaVersion(Base):
    """La lógica vigente en un periodo de tiempo específico."""
    __tablename__ = "reglas_versiones"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    regla_uuid: Mapped[uuid.UUID] = mapped_column(ForeignKey("reglas_identidad.uuid"), nullable=False)
    
    # Metadatos de Ejecución
    prioridad: Mapped[int] = mapped_column(Integer, default=50) # 100 = Alta, 0 = Baja
    severidad = mapped_column(SeveridadRegla, nullable=False, default='ERROR')
    tipo = mapped_column(TipoRegla, nullable=False, default='OBLIGATORIA')
    
    # La Lógica Pura
    logica_json: Mapped[dict] = mapped_column(JSONB, nullable=False)
    template_error: Mapped[str] = mapped_column(String, nullable=False) # Usaremos string.Template
    
    # Vigencia Temporal (Time Travel)
    vigencia: Mapped[object] = mapped_column(DATERANGE, nullable=False)
    
    regla = relationship("ReglaIdentidad", back_populates="versiones")

    # CONSTRAINT DE EXCLUSIÓN: Una regla no puede tener dos versiones activas al mismo tiempo
    __table_args__ = (
        ExcludeConstraint(
            (regla_uuid, '='),
            (vigencia, '&&'),
            name='evitar_solapamiento_reglas'
        ),
    )
2. El Contrato de Entrada (Pure Input)
El Engine no toca la DB. Recibe Pydantic y devuelve Pydantic.

Archivo: src/domain/schemas/compliance.py

Python
from pydantic import BaseModel, Field
from typing import Any, Dict, List, Literal

class ReglaEvaluable(BaseModel):
    """DTO puro para alimentar el motor."""
    id_version: str
    clave_regla: str
    logica: Dict[str, Any]
    template_error: str
    prioridad: int
    severidad: Literal['INFO', 'WARNING', 'ERROR', 'BLOCKER']
    
class ResultadoEvaluacion(BaseModel):
    es_valido: bool
    score_cumplimiento: float # 0.0 a 1.0
    errores: List[str]
    warnings: List[str]
    reglas_ejecutadas: int
3. El Compliance Engine (Pure Function)
Sin print. Sin DB. Con logging y Template.

Archivo: src/domain/services/compliance_engine.py

Python
import logging
from string import Template
from typing import Dict, Any, List
from json_logic import jsonLogic
from src.domain.schemas.compliance import ReglaEvaluable, ResultadoEvaluacion

# A. Logging Estructurado
logger = logging.getLogger("lex_mx.compliance_engine")

class ComplianceEngine:
    """
    Motor determinista puro. 
    Stateless: (Contexto + Reglas) -> Resultado
    """
    
    def evaluar(self, contexto: Dict[str, Any], reglas: List[ReglaEvaluable]) -> ResultadoEvaluacion:
        errores = []
        warnings = []
        reglas_ejecutadas = 0
        
        # B. Ordenar por prioridad (Las críticas primero para Fail-Fast si fuera necesario)
        reglas_ordenadas = sorted(reglas, key=lambda r: r.prioridad, reverse=True)
        
        logger.info(f"Iniciando evaluación de {len(reglas)} reglas.")
        
        for regla in reglas_ordenadas:
            try:
                # C. Ejecución de json-logic segura
                # TODO: Aquí iría la validación de schema JSON antes de ejecutar
                cumple = jsonLogic(regla.logica, contexto)
                
                reglas_ejecutadas += 1
                
                if not cumple:
                    # D. Interpolación Segura
                    mensaje = self._formatear_mensaje(regla.template_error, contexto)
                    
                    if regla.severidad in ['ERROR', 'BLOCKER']:
                        logger.debug(f"Regla fallida (BLOCKING): {regla.clave_regla}")
                        errores.append(mensaje)
                        # Opcional: Implementar Short-circuit aquí si es BLOCKER
                    else:
                        logger.debug(f"Regla fallida (WARNING): {regla.clave_regla}")
                        warnings.append(mensaje)
                        
            except Exception as e:
                # E. Manejo de Excepciones sin romper el flujo completo (o sí, según diseño)
                logger.error(f"Error crítico ejecutando regla {regla.clave_regla}: {str(e)}", exc_info=True)
                errores.append(f"Error de sistema en regla {regla.clave_regla}")

        es_valido = len(errores) == 0
        
        return ResultadoEvaluacion(
            es_valido=es_valido,
            score_cumplimiento=1.0 if es_valido else 0.0, # Simplificado
            errores=errores,
            warnings=warnings,
            reglas_ejecutadas=reglas_ejecutadas
        )

    def _formatear_mensaje(self, template_str: str, contexto: Dict) -> str:
        """Interpolación segura que no explota si falta una variable."""
        try:
            return Template(template_str).safe_substitute(contexto)
        except Exception:
            return template_str # Fallback seguro
4. Test Unitario Enterprise (Pytest)
Validamos lógica, límites y seguridad.

Archivo: tests/test_compliance_engine.py

Python
import pytest
from src.domain.services.compliance_engine import ComplianceEngine
from src.domain.schemas.compliance import ReglaEvaluable

# Fixtures (Datos de prueba)
@pytest.fixture
def engine():
    return ComplianceEngine()

@pytest.fixture
def regla_gasolina():
    return ReglaEvaluable(
        id_version="v1",
        clave_regla="ISR-GAS-001",
        prioridad=100,
        severidad="ERROR",
        template_error="Gasto de combustible por $monto requiere tarjeta, no $metodo_pago.",
        logica={
            "if": [
                {"and": [
                    {"==": [{"var": "tipo"}, "combustible"]},
                    {">": [{"var": "monto"}, 2000]}
                ]},
                {"in": [{"var": "metodo_pago"}, ["TARJETA", "TRANSFERENCIA"]]},
                True # Pasa si no es combustible > 2000
            ]
        }
    )

def test_gasolina_pago_invalido(engine, regla_gasolina):
    """Caso Negativo: Efectivo > 2000"""
    contexto = {"tipo": "combustible", "monto": 3000, "metodo_pago": "EFECTIVO"}
    
    resultado = engine.evaluar(contexto, [regla_gasolina])
    
    assert resultado.es_valido is False
    assert len(resultado.errores) == 1
    # Validar interpolación segura
    assert "requiere tarjeta, no EFECTIVO" in resultado.errores[0]

def test_gasolina_limite_exacto(engine, regla_gasolina):
    """Caso Borde: Exactamente 2000 (Debe pasar en efectivo)"""
    contexto = {"tipo": "combustible", "monto": 2000, "metodo_pago": "EFECTIVO"}
    
    resultado = engine.evaluar(contexto, [regla_gasolina])
    
    assert resultado.es_valido is True
    assert len(resultado.errores) == 0

def test_interpolacion_segura_variables_faltantes(engine):
    """Si el contexto no tiene la variable del mensaje, no debe explotar"""
    regla_rota = ReglaEvaluable(
        id_version="v1", clave_regla="TEST", prioridad=10, severidad="ERROR",
        template_error="Error en campo $variable_inexistente",
        logica={"==": [1, 2]} # Siempre falla
    )
    
    resultado = engine.evaluar({}, [regla_rota])
    
    assert resultado.es_valido is False
    # El mensaje debe salir raw o con placeholder vacío, pero no Exception
    assert "Error en campo $variable_inexistente" in resultado.errores[0]
Próximos Pasos (Implementación)
Instalar dependencias: uv add json-logic-py.

Actualizar Modelos: Copiar el código de models.py para incluir ReglaIdentidad y ReglaVersion con el ExcludeConstraint.

Crear Engine: Implementar src/domain/services/compliance_engine.py tal cual lo diseñamos arriba.

Correr Tests: Crear el archivo de test y ejecutar uv run pytest tests/test_compliance_engine.py.

