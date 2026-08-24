-- ============================================================================
-- 006 · QUE LAS POLÍTICAS NO REPITAN TRABAJO
-- ----------------------------------------------------------------------------
-- Escrito como `auth.uid() = id`, Postgres vuelve a resolver auth.uid() en
-- CADA fila que mira. Envuelto en (SELECT ...), lo resuelve UNA vez y compara
-- contra ese valor.
--
-- Con la tabla vacía da igual; con miles de perfiles, no. Y no cambia nada de
-- lo que la política permite: exactamente las mismas filas.
--
-- Lo señaló el revisor de Supabase (lint 0003_auth_rls_initplan) al pasarlo
-- sobre la base ya aplicada. Aplicar esto lo deja limpio.
--
-- Se puede correr las veces que haga falta: solo vuelve a crear las políticas.
-- ============================================================================

DROP POLICY IF EXISTS "ve su propio perfil"    ON perfiles;
DROP POLICY IF EXISTS "crea su propio perfil"  ON perfiles;
DROP POLICY IF EXISTS "edita su propio perfil" ON perfiles;

CREATE POLICY "ve su propio perfil"    ON perfiles
    FOR SELECT TO authenticated USING ((SELECT auth.uid()) = id);
CREATE POLICY "crea su propio perfil"  ON perfiles
    FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = id);
CREATE POLICY "edita su propio perfil" ON perfiles
    FOR UPDATE TO authenticated
    USING ((SELECT auth.uid()) = id) WITH CHECK ((SELECT auth.uid()) = id);
