import {
  Badge,
  Button,
  DirectionProvider,
  MantineProvider,
  Select,
} from "@mantine/core"
import { useRef, useState } from "react"
import "@mantine/core/styles.css"
import "@mantine/dates/styles.css"
import "@fortawesome/fontawesome-free/css/all.css"
import { useColorScheme } from "@mantine/hooks"
import { TimeInput } from "@mantine/dates"
import Header from "./Header"
import Footer from "./Footer"

const DAYS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי"]
const UNIVERSITY_DAYS = ["א", "ב", "ג", "ד", "ה", "ו"]
const SEMESTERS = ["2023a", "2023b", "2024a", "2024b", "2025a", "2025b"]
const CURRENT_SEMESTER = "2025a"

const arraysEqual = (a: any[], b: any[]) => {
  if (a === b) return true
  if (a == null || b == null) return false
  if (a.length !== b.length) return false

  for (var i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) return false
  }
  return true
}

const SEMESTER_ENGLISH_TO_HEBREW: Record<string, string> = {
  a: "א'",
  b: "ב'",
}

const formatSemester = (semester: string) => {
  return semester.slice(0, 4) + SEMESTER_ENGLISH_TO_HEBREW[semester[4]]
}

const App = () => {
  const colorScheme = useColorScheme()
  const dayRef = useRef<HTMLInputElement>(null)
  const startRef = useRef<HTMLInputElement>(null)
  const endRef = useRef<HTMLInputElement>(null)
  const [semester, setSemester] = useState(CURRENT_SEMESTER)
  const [availableRooms, setAvailableRooms] = useState<
    Record<string, Set<string>>
  >({})
  const [loading, setLoading] = useState(false)

  const search = async () => {
    console.log("meow")
    setAvailableRooms({})
    setLoading(true)
    try {
      const day = DAYS.indexOf(dayRef.current?.value ?? "ראשון")
      const startHour = parseInt(
        startRef.current?.value?.split(":")[0] ?? "0",
        10
      )
      const endHour = parseInt(endRef.current?.value?.split(":")[0] ?? "0", 10)

      const response = await fetch(
        `https://arazim-project.com/courses/courses-${semester}.json`
      )
      const courses = await response.json()
      const buildings: Record<string, Set<string>> = {}
      for (const course of Object.values(courses) as any) {
        for (const group of course.groups) {
          for (const lesson of group.lessons) {
            if (lesson.room === "") {
              continue
            }

            const building = buildings[lesson.building] ?? new Set()
            buildings[lesson.building] = building
            building.add(lesson.room)
          }
        }
      }

      for (const course of Object.values(courses) as any) {
        for (const group of course.groups) {
          for (const lesson of group.lessons) {
            if (lesson.day === UNIVERSITY_DAYS[day]) {
              if (lesson.room === "") {
                continue
              }

              const lessonStartHour = parseInt(
                lesson.time.split("-")[0].split(":")[0],
                10
              )
              const lessonEndHour = parseInt(
                lesson.time.split("-")[1].split(":")[0],
                10
              )
              const sortedHours = [
                startHour,
                endHour,
                lessonStartHour,
                lessonEndHour,
              ]
              sortedHours.sort((a, b) => a - b)
              if (
                !arraysEqual(sortedHours, [
                  startHour,
                  endHour,
                  lessonStartHour,
                  lessonEndHour,
                ]) &&
                !arraysEqual(sortedHours, [
                  lessonStartHour,
                  lessonEndHour,
                  startHour,
                  endHour,
                ])
              ) {
                buildings[lesson.building].delete(lesson.room)
              }
            }
          }
        }
      }

      setAvailableRooms(buildings)
    } finally {
      setLoading(false)
    }
  }

  return (
    <DirectionProvider>
      <MantineProvider
        theme={{ primaryColor: "green" }}
        forceColorScheme={colorScheme}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <Header />
          <div
            style={{
              flexGrow: 1,
              width: "100%",
              display: "flex",
              justifyContent: "center",
              overflow: "auto",
            }}
          >
            <div
              style={{
                width: 400,
                maxWidth: "95%",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div style={{ flex: "none" }}>
                <Select
                  label="סמסטר"
                  leftSection={<i className="fa-solid fa-cloud-moon" />}
                  data={SEMESTERS.map((semester) => ({
                    value: semester,
                    label: formatSemester(semester),
                  }))}
                  value={semester}
                  onChange={(v) => setSemester(v ?? CURRENT_SEMESTER)}
                />
                <Select
                  ref={dayRef}
                  label="יום"
                  data={DAYS}
                  leftSection={<i className="fa-solid fa-calendar-day" />}
                />
                <TimeInput
                  ref={startRef}
                  label="התחלה"
                  leftSection={<i className="fa-solid fa-clock" />}
                />
                <TimeInput
                  ref={endRef}
                  label="סיום"
                  leftSection={<i className="fa-solid fa-clock" />}
                />
                <Button
                  loading={loading}
                  my="xs"
                  fullWidth
                  leftSection={<i className="fa-solid fa-search" />}
                  onClick={search}
                >
                  חיפוש
                </Button>
              </div>
              {Object.keys(availableRooms)
                .filter(
                  (buildingName) => availableRooms[buildingName].size !== 0
                )
                .sort()
                .map((buildingName, index) => (
                  <div key={index}>
                    <h2>{buildingName}</h2>
                    {Array.from(availableRooms[buildingName])
                      .sort()
                      .map((room, roomIndex) => (
                        <Badge key={roomIndex} m={3} size="xl">
                          {room}
                        </Badge>
                      ))}
                  </div>
                ))}
            </div>
          </div>
          <Footer />
        </div>
      </MantineProvider>
    </DirectionProvider>
  )
}

export default App
