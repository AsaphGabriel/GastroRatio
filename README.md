# ⚖️ GastroRatio — Engenharia Culinária & Despensa Inteligente (PWA)

> **Assistente culinário Local-First de alta precisão:** redimensiona receitas em gramas exatos, calcula *Baker's Percentage*, sugere pratos com insumos perecíveis sem atrito de cadastro de sal e óleo, e integra assistência de IA (Gemini 2.5 Flash) com cascata de baixo atrito.

---

## 🚀 Destaques Arquiteturais & Pilares de Engenharia

O GastroRatio foi concebido sob os 19 Pilares de Engenharia de Software da Yggdrasil:

1. **Local-First & Privacidade por Padrão (Pilar 2 & 9):**
   - 100% dos dados residem no cliente via **IndexedDB (Dexie.js)**.
   - Zero dependência de servidores em nuvem ou bancos relacionais remotos para operação diária (TCO = R$ 0,00).
   - Backup e restauração JSON protegidos por **transação ACID** e validação estrita de runtime via **Zod**.
2. **Motor Matemático Determinístico em Gramas (Pilar 3 & 16):**
   - Conversor de densidade real ($O(1)$) que distingue farinha (120g/xícara), açúcar refinado (200g/xícara) e manteiga (227g/xícara).
   - Redimensionador proporcional dual: por número de porções ou por ingrediente âncora travado.
   - Calculadora de panificação (*Baker's Percentage*) com a farinha invariante em 100% e cálculo de hidratação.
3. **Axioma da Despensa Básica (Pilar 18 & JTBD):**
   - Elimina o atrito de cadastrar insumos coringa (sal, açúcar, azeite, alho, cebola, vinagre, pimenta).
   - Algoritmo de cruzamento em $O(M)$ com categorização instantânea: *100% Viáveis Agora* ou *Falta 1 Ingrediente*.
4. **Estratégia de Cascata em 2 Camadas para Parse de Receitas:**
   - **Camada 1 (Zero Atrito / Padrão):** Parser determinístico local em TypeScript executando no navegador em 0ms, offline e sem chaves de API.
   - **Camada 2 (Fallback Sob Demanda / BYOK):** Assistente Sous-Chef integrado ao **Gemini 2.5 Flash** para estruturação de textos caóticos da internet.
5. **Segurança de Software & Modelagem de Ameaças (Pilar 9 - STRIDE):**
   - **Abstração da Chave BYOK:** Armazenamento seguro ofuscado no cliente, eliminando chaves em texto puro no `localStorage`.
   - **Isolamento de Rede:** Chave enviada **exclusivamente via cabeçalho HTTP TLS (`x-goog-api-key`)**, sem poluição de URLs (`?key=`), prevenindo vazamentos em proxies corporativos e firewalls.
   - **Mitigação de DoS / Token Flooding:** Trava rígida de 5.000 caracteres no `<textarea>` e sanitização por truncamento defensivo antes da chamada à IA.
   - **Transacionalidade ACID em Backups:** Ingestão de backups externos protegida por validação estrita Zod com rollback automático em caso de arquivo corrompido ou payload hostil.

---

## 🛠️ Stack Tecnológica

* **Frontend:** React 19, TypeScript 5.8, Tailwind CSS, Lucide React.
* **Build & Bundler:** Vite 8.3, Plugin Vite PWA (Workbox).
* **Persistência Local:** Dexie.js (IndexedDB Wrapper ACID).
* **Validação de Runtime:** Zod.
* **Testes & TDD:** `node:test` nativo via `tsx` (20 suites de teste com 100% de cobertura).

---

## 📦 Instalação & Execução

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento (HMR)
npm run dev

# Executar suíte completa de testes unitários (TDD)
npm test

# Compilar para produção (PWA otimizado < 150 KB gzip)
npm run build
```

---

## 📖 Documentação Canônica (Cofre Yggdrasil)

Para especificações detalhadas, consulte o hub de documentação no cofre do projeto:

* **MOC Geral:** `02_Projetos_Ativos/GastroRatio_Docs/MOC_GastroRatio.md`
* **Segurança & STRIDE:** `02_Projetos_Ativos/GastroRatio_Docs/Seguranca_e_Modelagem_Ameacas_GastroRatio.md`
* **Arquitetura & Schemas Zod:** `02_Projetos_Ativos/GastroRatio_Docs/Arquitetura_e_Contratos_GastroRatio.md`
* **Especificação de Requisitos:** `02_Projetos_Ativos/GastroRatio_Docs/Especificacao_Requisitos_GastroRatio.md`
* **Memória & ADRs:** `02_Projetos_Ativos/GastroRatio_Docs/MEMORIA_GASTRORATIO.md`
* **Roadmap de Entregas:** `02_Projetos_Ativos/GastroRatio_Docs/ROADMAP.md`
