"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");

/** Related functions for applications. */

class Application {
  /** Create an application record.
   * Accepts query params: 
   * @param {String} queryParams.username
   * @param {Number} queryParams.jobId
   * @returns {Object} - { username, jobId }
   *
   * Throws BadRequestError if application already in database.
   * Throws NotFoundError if no user found for the given username in database.
   * Throws NotFoundError if no job found for the given jobId in database.
   * */

  static async create({ username, jobId }) {
    const duplicateCheck = await db.query(
      `SELECT job_id FROM applications WHERE username = $1 AND job_id = $2`,
      [username, jobId]
    );

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate application: ${username}`);

    const checkUser = await db.query(
      `SELECT username FROM users WHERE username = $1`,
      [username]
    );
    if (!checkUser.rows[0])
      throw new NotFoundError(`No such user: ${username}`);

    const checkJob = await db.query(`SELECT title FROM jobs WHERE id = $1`, [
      jobId,
    ]);
    if (!checkJob.rows[0]) throw new NotFoundError(`No such job: ${jobId}`);

    const result = await db.query(
      `INSERT INTO applications
       (username, job_id)
       VALUES ($1, $2)
       RETURNING username, job_id AS "jobId"`,
      [username, jobId]
    );

    return result.rows[0];
  }
}

module.exports = Application;
