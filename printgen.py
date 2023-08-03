import copy
import json
import random
from datetime import timedelta

import names
from faker import Faker
from random_word import RandomWords

fake = Faker()
r = RandomWords()

struct = {

    "trayName": "",
    "printer": "",
    "estTime": "",
    "materialType": "",
    "materialUsage": "",
    "queuedBy": "some PI",
    "queuedAt": "",
    "state": 0,
    "notes": "",
    "endUser": {
        "firstname": "",
        "lastname": "",
        "email": ""
    },
    "events": [],
    "updatedAt": ""

}


printers = {
    "ultimaker": [
        "ultimaker-1", "ultimaker-2", "ultimaker-3", "ultimaker-4"
    ],
    "stratasys": [
        "left-stratasys", "center-stratasys", "right-stratasys"
    ],
    "formlabs": [
        "cloudypytilia", "wealthyacouchi"
    ]
}

materials = {
    "ultimaker": ["PLA"],
    "stratasys": ["ABS"],
    "formlabs": ["Resin (White)", "Resin (Clear)"]
}


def main():
    output = []
    for i in range(50):
        # generate a random name
        name = names.get_full_name()

        # split the name into first and last
        first, last = name.split(" ")
        # create a new struct via deepcopy
        new_struct = copy.deepcopy(struct)
        # set the first and last name
        new_struct["endUser"]["firstname"] = first
        new_struct["endUser"]["lastname"] = last
        # set the PI name
        # set the email
        new_struct["endUser"]["email"] = first.lower()[0] + "" + \
            last.lower() + str(random.randrange(0, 15))
        # set the tray name
        new_struct["trayName"] = first + "_" + \
            last + "_" + r.get_random_word()

        printer_type = list(printers.keys())[
            random.randrange(0, len(printers.keys()))]
        printer_name = printers[printer_type][random.randrange(
            0, len(printers[printer_type]))]
        new_struct["printer"] = printer_name
        new_struct["materialType"] = materials[printer_type][random.randrange(
            len(materials[printer_type]))]
        new_struct["materialUsage"] = random.randrange(0, 100)
        new_struct["estTime"] = f"PT{random.randrange(0, 10)}H{random.randrange(0, 60)}M"

        datetime = fake.date_time_between(start_date='-30d', end_date='now')
        time = datetime.replace(microsecond=0).isoformat()
        new_struct["queuedAt"] = time

        new_struct["events"].append({
            "type": "queued",
            "timestamp": time
        })

        output.append(new_struct)

    print(json.dumps(output))


if __name__ == "__main__":
    main()
