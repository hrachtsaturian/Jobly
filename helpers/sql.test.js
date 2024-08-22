const { sqlForPartialUpdate } = require("./sql");

describe("sqlForPartialUpdate", () => {
  test("should throw No data error", () => {
    const dataToUpdate = {};

    const jsToSql = {
      numEmployees: "num_employees",
    };

    expect(() => sqlForPartialUpdate(dataToUpdate, jsToSql)).toThrow("No data");
  });

  test("should return updated cols with values", () => {
    const dataToUpdate = {
      name: "Yelp",
      description: "Big corp",
      numEmployees: 1500,
    };

    const jsToSql = {
      numEmployees: "num_employees",
    };

    expect(sqlForPartialUpdate(dataToUpdate, jsToSql)).toEqual({
      setCols: "\"name\"=$1, \"description\"=$2, \"num_employees\"=$3",
      values: ["Yelp", "Big corp", 1500]
    })
  });
});
