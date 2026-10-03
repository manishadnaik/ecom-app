import { GoogleGenAI } from '@google/genai';
import 'dotenv/config';
import  sequelize  from '../config/database.js';

// Initialize the client (automatically uses process.env.GEMINI_API_KEY)
const ai = new GoogleGenAI();

// 1. Define your Database Schema for the LLM
const dbSchema = `
Table: customers
- id (INT, PRIMARY KEY, AUTO_INCREMENT)
- name (VARCHAR, NOT NULL)
- email (VARCHAR, NOT NULL, UNIQUE)
- phone (VARCHAR, NULLABLE)
- address (VARCHAR, NULLABLE)
- created_at (DATETIME, NOT NULL)
- updated_at (DATETIME, NOT NULL)

Table: categories
- id (INT, PRIMARY KEY, AUTO_INCREMENT)
- name (VARCHAR, NOT NULL, UNIQUE)
- created_at (DATETIME, NOT NULL)
- updated_at (DATETIME, NOT NULL)

Table: products
- id (INT, PRIMARY KEY, AUTO_INCREMENT)
- name (VARCHAR, NOT NULL)
- description (TEXT, NULLABLE)
- category_id (INT, FOREIGN KEY referencing categories.id, NOT NULL)
- price (DECIMAL(10,2), NOT NULL)
- stock_quantity (INT, NOT NULL)
- status (ENUM('ACTIVE', 'INACTIVE'), NOT NULL, DEFAULT 'ACTIVE')
- created_at (DATETIME, NOT NULL)
- updated_at (DATETIME, NOT NULL)

Table: orders
- id (INT, PRIMARY KEY, AUTO_INCREMENT)
- customer_id (INT, FOREIGN KEY referencing customers.id, NOT NULL)
- status (ENUM('PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'), NOT NULL, DEFAULT 'PENDING')
- order_date (DATETIME, NOT NULL)
- created_at (DATETIME, NOT NULL)
- updated_at (DATETIME, NOT NULL)
- cancelled_at (DATETIME, NULLABLE)

Table: order_items
- id (INT, PRIMARY KEY, AUTO_INCREMENT)
- order_id (INT, FOREIGN KEY referencing orders.id, NOT NULL)
- product_id (INT, FOREIGN KEY referencing products.id, NOT NULL)
- quantity (INT, NOT NULL)
- unit_price_at_purchase (DECIMAL(10,2), NOT NULL)
`;

// 2. Define the exact System Prompt
const systemInstruction = `
You are a strict Text-to-SQL translator for an e-commerce database.
Your job is to read the user's natural language request and translate it into a valid SQL query.
Do not generate any sql query that can alter db in any sense instead return response that this type of request cannot be processed.
This is a READ-ONLY database. NEVER emit INSERT/UPDATE/DELETE/DDL. If the user asks you to modify data, refuse and return a SELECT that does nothing.

Here is the database schema:
${dbSchema}

CRITICAL RULES:
1. Return ONLY the raw SQL query. Do not wrap it in markdown code blocks like \\\`\\\`\\\`sql.
2. Do not include any explanations, conversational text, or introductions.
3. Only use tables and columns defined in the schema.
4. For text matches (like email or category), use exact matches or standard SQL operators.
5. Create optimized sql query, do not select all columns.
6. Strict Column Selection: Never use SELECT *. You must explicitly select only necessary fields.
7. Data Protection: Exclude crucial, internal, or highly sensitive columns (e.g., customer passwords, internal cost margins, full tracking tokens, or backend audit timestamps).
`;

/**
 * Generates SQL from a natural language query
 * @param {string} userPrompt - e.g., "Show me all pending orders"
 * @returns {Promise<string>} - The raw SQL query
 */
async function generateSQL(userPrompt) {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash', // The fast, cost-efficient model perfect for SQL generation
      contents: userPrompt,
      config: {
        systemInstruction: systemInstruction,
        // Low temperature keeps the model deterministic and strictly focused on the rules
        temperature: 0.1,
      }
    });

    // Clean up any stray white space or accidental markdown if it happens
    return response.text.replace(/```sql|```/g, '').trim();
  } catch (error) {
    console.error("Failed to generate SQL:", error);
    throw error;
  }
}

// Example Express API Endpoint integration

const search = async (req, res) => {
  try {
    const { query } = req.body; // e.g., "Find all products that are out of stock"
    const generatedSQL = await generateSQL(query);
    
    // Execute against your database (e.g., pg, mysql2, or sequelize)
    const [rows] = await sequelize.query(generatedSQL); 
    res.json({ naturalLanguageQuery: query, generatedSQL, results: rows, rowCount: rows.length });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export { search }

