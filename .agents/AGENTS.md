# Workspace Rules & Lessons Learned (Headroom Learn)

## 🗄️ Database & Schema Conventions (MSSQL)
- **Always verify column existence natively**: When executing database migrations or dynamic column additions, use the native SQL Server check (`sys.columns`) instead of querying `INFORMATION_SCHEMA.COLUMNS` with string equality, as collation, catalog, or schema differences (e.g., `dbo`) can cause the latter to fail.
  * *Example (Safe Column Check)*:
    ```sql
    IF NOT EXISTS (
      SELECT * FROM sys.columns 
      WHERE object_id = OBJECT_ID('dbo.Users') AND name = 'department'
    )
    BEGIN
      ALTER TABLE dbo.Users ADD department VARCHAR(100) NULL;
    END
    ```
- **Users Table Columns**:
  - `department`: Ensure it is present as it is queried in multiple leader and user dashboard lookups.
- **Alumni Table Extra Columns**:
  - `date_of_birth` (VARCHAR(20))
  - `working_details` (VARCHAR(500))
  - `linkedin_profile` (VARCHAR(255))

## 📊 Excel Import Logic (Multer/xlsx)
- **Validate Primary Keys**: Always check that `register_no` is present and valid in the records array before attempting insertion to prevent transaction rollbacks due to NULL violations.
  * *Validation Rule*:
    ```javascript
    if (!record.registerNo || String(record.registerNo).trim() === '' || String(record.registerNo).trim().toLowerCase() === 'null') {
      continue;
    }
    ```

## 📨 Email Client Integrations
- **Validate Variable Scopes**: When calling email helpers like `sendPasswordResetEmail`, verify that the second argument (`temporaryPassword` / `plainPassword`) is strictly defined and in scope. Do not pass undefined variables to avoid runtime template reference crashes.

## ⚡ Output Optimization & Terse Style
- Keep responses, code modifications, and explanations extremely concise and direct to save token usage and execution time.
