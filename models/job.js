"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for jobs. */

class Job {
  /** Create a job (from data), update db, return new job data.
   *
   * data should be { title, salary, equity, company_handle }
   *
   * Returns { id, title, salary, equity, company_handle }
   *
   * Throws BadRequestError if job already in database.
   * Throws NotFoundError if no company found for the given copmanyHandle.
   * */

  static async create({ title, salary, equity, companyHandle }) {
    const duplicateCheck = await db.query(
      `SELECT title
           FROM jobs
           WHERE title = $1`,
      [title]
    );
    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate job: ${title}`);

    const checkCompanyHandle = await db.query(
      `SELECT name
           FROM companies
           WHERE handle = $1`,
      [companyHandle]
    );
    if (!checkCompanyHandle.rows[0])
      throw new NotFoundError(`No such company: ${companyHandle}`);

    const result = await db.query(
      `INSERT INTO jobs
           (title, salary, equity, company_handle)
           VALUES ($1, $2, $3, $4)
           RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
      [title, salary, equity, companyHandle]
    );
    const job = result.rows[0];

    return job;
  }

  /** Find all jobs.
   * Accepts filter params: {title, minSalary, hasEquity}
   * @param {Object} queryParams
   * @param {String} queryParams.title
   * @param {Number} queryParams.minSalary - NaN will be ignored
   * @param {Boolean} queryParams.hasEquity
   * @returns {Array<Object>} - [{ title, salary, equity, company_handle }, ...]
   * */

  static async findAll(queryParams = {}) {
    const conditionals = [];
    const values = [];
    console.log({ queryParams });

    Object.keys(queryParams).forEach((param) => {
      if (param === "title" && queryParams.title) {
        conditionals.push(`LOWER(title) LIKE $${conditionals.length + 1}`);
        values.push(`%${queryParams.title}%`);
      }
      if (param === "minSalary") {
        conditionals.push(`salary >= $${conditionals.length + 1}`);
        values.push(`${queryParams.minSalary}`);
      }
      if (param === "hasEquity" && queryParams.hasEquity) {
        conditionals.push(`equity > $${conditionals.length + 1}`
        );
        values.push(0);
      }
    });
    const whereClause = conditionals.length
      ? `WHERE ${conditionals.join(" AND ")}`
      : "";
    const query = `SELECT id, 
                  title,
                  salary,
                  equity,
                  company_handle AS "companyHandle"
           FROM jobs
           ${whereClause}
           ORDER BY title`;
    const jobsRes = await db.query(query, values);
    return jobsRes.rows;
  }

  /** Given a job id, return data about job.
   *
   * Returns { id, title, salary, equity, company_handle }
   *   where jobs is [{ id, title, salary, equity, company_handle }, ...] ??
   *
   * Throws NotFoundError if not found.
   **/

  static async get(id) {
    const jobRes = await db.query(
      `SELECT id, title, salary, equity, company_handle AS "companyHandle"
           FROM jobs
           WHERE id = $1`,
      [id]
    );

    const job = jobRes.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);

    return job;
  }

  /** Update job data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: { title, salary, equity }
   *
   * Returns { id, title, salary, equity, company_handle }
   *
   * Throws NotFoundError if not found.
   */

  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(data, {});
    const idVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE jobs
                        SET ${setCols}
                        WHERE id = ${idVarIdx}
                        RETURNING id,
                                  title,
                                  salary,
                                  equity,
                                  company_handle AS "companyHandle"`;
    const result = await db.query(querySql, [...values, id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);

    return job;
  }

  /** Delete given job from database; returns undefined.
   *
   * Throws NotFoundError if job not found.
   **/

  static async remove(id) {
    const result = await db.query(
      `DELETE
           FROM jobs
           WHERE id = $1
           RETURNING id`,
      [id]
    );
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);
  }
}

module.exports = Job;
