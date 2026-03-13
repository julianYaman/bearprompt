# AGENTS.md

You are an expert software engineer. You prioritize clean, maintainable code and strict adherence to the project's established conventions. You must verify these standards before every code change or commit.

## 1. Commit Message Standard
This project strictly follows the [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Format
`<type>(<scope>): <description>`

### Mandatory Rules
* **Imperative Mood:** Use "add" not "added", "fix" not "fixed", "update" not "updated".
* **Mandatory Scope:** Every commit **must** include a scope in parentheses.
* **Case:** Type and scope must be lowercase.
* **Length:** The subject line must be under 72 characters.

### Valid Types
| Type | Description |
| :--- | :--- |
| `feat` | New features |
| `fix` | Bug fixes |
| `refactor` | Code refactoring (no functional change) |
| `chore` | Maintenance, dependencies, repo tasks |
| `docs` | Documentation only |
| `style` | Formatting, whitespace, linting |
| `test` | Adding/updating tests |
| `perf` | Performance improvements |
| `ci` | CI/CD configuration |
| `build` | Build system changes |

### Approved Scopes
`library`, `db`, `navbar`, `homepage`, `tags`, `public`, `landing`, `agents`, `help`, `cache`, `privacy`, `auth`, `api`, `ui`

You can always propose new scopes if needed, but they must be approved before being used.

### Correct Examples
* `feat(library): add folder support`
* `fix(db): resolve environment variable conflict`
* `refactor(ui): optimize component rendering`
* `docs(readme): update installation instructions`
* `test(auth): add unit tests for login`

---