const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

const employees = [
  // КБ
  {
    first_name: 'Александр',
    last_name: 'Петров',
    middle_name: 'Владимирович',
    department: 'КБ',
    position: 'Технолог',
    employee_number: '001',
    phone: '+7 (495) 123-45-67',
    email: 'a.petrov@sofany.ru',
    hire_date: '2020-01-15'
  },
  {
    first_name: 'Елена',
    last_name: 'Сидорова',
    middle_name: 'Александровна',
    department: 'КБ',
    position: 'Дизайнер',
    employee_number: '002',
    phone: '+7 (495) 123-45-68',
    email: 'e.sidorova@sofany.ru',
    hire_date: '2021-03-10'
  },
  {
    first_name: 'Михаил',
    last_name: 'Козлов',
    middle_name: 'Игоревич',
    department: 'КБ',
    position: 'Менеджер производства',
    employee_number: '003',
    phone: '+7 (495) 123-45-69',
    email: 'm.kozlov@sofany.ru',
    hire_date: '2019-06-01'
  },

  // Столярный цех
  {
    first_name: 'Иван',
    last_name: 'Смирнов',
    middle_name: 'Петрович',
    department: 'Столярный цех',
    position: 'Мастер столярного цеха',
    employee_number: '101',
    phone: '+7 (495) 123-45-70',
    email: 'i.smirnov@sofany.ru',
    hire_date: '2018-09-15'
  },
  {
    first_name: 'Сергей',
    last_name: 'Васильев',
    middle_name: 'Андреевич',
    department: 'Столярный цех',
    position: 'Столяр',
    employee_number: '102',
    phone: '+7 (495) 123-45-71',
    email: 's.vasiliev@sofany.ru',
    hire_date: '2020-02-20'
  },
  {
    first_name: 'Дмитрий',
    last_name: 'Попов',
    middle_name: 'Сергеевич',
    department: 'Столярный цех',
    position: 'Кромщик',
    employee_number: '103',
    phone: '+7 (495) 123-45-72',
    email: 'd.popov@sofany.ru',
    hire_date: '2021-05-10'
  },
  {
    first_name: 'Андрей',
    last_name: 'Соколов',
    middle_name: 'Дмитриевич',
    department: 'Столярный цех',
    position: 'Сборщик',
    employee_number: '104',
    phone: '+7 (495) 123-45-73',
    email: 'a.sokolov@sofany.ru',
    hire_date: '2022-01-15'
  },
  {
    first_name: 'Николай',
    last_name: 'Лебедев',
    middle_name: 'Андреевич',
    department: 'Столярный цех',
    position: 'Помощник столяра',
    employee_number: '105',
    phone: '+7 (495) 123-45-74',
    email: 'n.lebedev@sofany.ru',
    hire_date: '2022-08-01'
  },

  // Обивочный цех
  {
    first_name: 'Ольга',
    last_name: 'Новикова',
    middle_name: 'Ивановна',
    department: 'Обивочный цех',
    position: 'Мастер обивки',
    employee_number: '201',
    phone: '+7 (495) 123-45-75',
    email: 'o.novikova@sofany.ru',
    hire_date: '2019-04-12'
  },
  {
    first_name: 'Татьяна',
    last_name: 'Морозова',
    middle_name: 'Сергеевна',
    department: 'Обивочный цех',
    position: 'Обивщик',
    employee_number: '202',
    phone: '+7 (495) 123-45-76',
    email: 't.morozova@sofany.ru',
    hire_date: '2020-07-20'
  },
  {
    first_name: 'Наталья',
    last_name: 'Волкова',
    middle_name: 'Александровна',
    department: 'Обивочный цех',
    position: 'Обивщик',
    employee_number: '203',
    phone: '+7 (495) 123-45-77',
    email: 'n.volkova@sofany.ru',
    hire_date: '2021-11-05'
  },

  // Швейный цех
  {
    first_name: 'Мария',
    last_name: 'Алексеева',
    middle_name: 'Петровна',
    department: 'Швейный цех',
    position: 'Швея',
    employee_number: '301',
    phone: '+7 (495) 123-45-78',
    email: 'm.alekseeva@sofany.ru',
    hire_date: '2020-03-15'
  },
  {
    first_name: 'Анна',
    last_name: 'Степанова',
    middle_name: 'Владимировна',
    department: 'Швейный цех',
    position: 'Швея',
    employee_number: '302',
    phone: '+7 (495) 123-45-79',
    email: 'a.stepanova@sofany.ru',
    hire_date: '2021-09-10'
  },

  // Формовочный цех
  {
    first_name: 'Владимир',
    last_name: 'Кузнецов',
    middle_name: 'Николаевич',
    department: 'Формовочный цех',
    position: 'Формовщик ППУ',
    employee_number: '401',
    phone: '+7 (495) 123-45-80',
    email: 'v.kuznetsov@sofany.ru',
    hire_date: '2020-06-01'
  },
  {
    first_name: 'Алексей',
    last_name: 'Орлов',
    middle_name: 'Владимирович',
    department: 'Формовочный цех',
    position: 'Формовщик ППУ',
    employee_number: '402',
    phone: '+7 (495) 123-45-81',
    email: 'a.orlov@sofany.ru',
    hire_date: '2021-12-15'
  },

  // Разнорабочий
  {
    first_name: 'Петр',
    last_name: 'Семенов',
    middle_name: 'Иванович',
    department: 'Разнорабочий',
    position: 'Грузчик',
    employee_number: '501',
    phone: '+7 (495) 123-45-82',
    email: 'p.semenov@sofany.ru',
    hire_date: '2022-02-01'
  },
  {
    first_name: 'Роман',
    last_name: 'Григорьев',
    middle_name: 'Андреевич',
    department: 'Разнорабочий',
    position: 'Подсобный рабочий',
    employee_number: '502',
    phone: '+7 (495) 123-45-83',
    email: 'r.grigoriev@sofany.ru',
    hire_date: '2022-05-20'
  }
];

async function seedEmployees() {
  try {
    console.log('🌱 Начинаем заполнение базы данных сотрудниками...');

    // Получаем ID отделов и должностей
    const departmentsResult = await pool.query('SELECT id, name FROM departments');
    const positionsResult = await pool.query('SELECT id, name, department_id FROM positions');
    
    const departmentMap = {};
    departmentsResult.rows.forEach(dept => {
      departmentMap[dept.name] = dept.id;
    });

    const positionMap = {};
    positionsResult.rows.forEach(pos => {
      positionMap[`${pos.name}_${pos.department_id}`] = pos.id;
    });

    let successCount = 0;
    let errorCount = 0;

    for (const employee of employees) {
      try {
        const departmentId = departmentMap[employee.department];
        if (!departmentId) {
          console.log(`❌ Отдел "${employee.department}" не найден для сотрудника ${employee.last_name}`);
          errorCount++;
          continue;
        }

        const positionId = positionMap[`${employee.position}_${departmentId}`];
        if (!positionId) {
          console.log(`❌ Должность "${employee.position}" не найдена для отдела "${employee.department}"`);
          errorCount++;
          continue;
        }

        // Проверяем, существует ли уже сотрудник с таким табельным номером
        const existingEmployee = await pool.query(
          'SELECT id FROM employees WHERE employee_number = $1',
          [employee.employee_number]
        );

        if (existingEmployee.rows.length > 0) {
          console.log(`⚠️  Сотрудник с табельным номером ${employee.employee_number} уже существует`);
          continue;
        }

        await pool.query(`
          INSERT INTO employees (
            first_name, last_name, middle_name, position_id, department_id,
            employee_number, phone, email, hire_date
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
          employee.first_name,
          employee.last_name,
          employee.middle_name,
          positionId,
          departmentId,
          employee.employee_number,
          employee.phone,
          employee.email,
          employee.hire_date
        ]);

        console.log(`✅ Добавлен сотрудник: ${employee.last_name} ${employee.first_name} (${employee.position})`);
        successCount++;

      } catch (error) {
        console.error(`❌ Ошибка при добавлении сотрудника ${employee.last_name}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n📊 Результаты заполнения:');
    console.log(`✅ Успешно добавлено: ${successCount} сотрудников`);
    console.log(`❌ Ошибок: ${errorCount}`);
    console.log(`📝 Всего обработано: ${employees.length} записей`);

  } catch (error) {
    console.error('❌ Критическая ошибка:', error);
  } finally {
    await pool.end();
  }
}

seedEmployees();







